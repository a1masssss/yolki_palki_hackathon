from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from google import genai
from google.genai import types
import os
import tempfile
from .models import VideoRecording, VideoSummary
import subprocess
import base64
import time

client = genai.Client(
    api_key=os.getenv('GEMINI_API_KEY'),
    http_options=types.HttpOptions(api_version='v1alpha')
)

@csrf_exempt
def upload_video(request):
    if request.method == 'POST':
        try:
            video_file = request.FILES.get('video')
            title = request.POST.get('title', 'Screen Recording')
            
            if not video_file:
                return JsonResponse({'error': 'No video file provided'}, status=400)
            
            video_record = VideoRecording.objects.create(
                title=title,
                video=video_file
            )
            
            process_video(video_record.id)
            
            return JsonResponse({
                'message': 'Video uploaded successfully and processing started',
                'video_id': video_record.id
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

def process_video(video_id):
    video_record = VideoRecording.objects.get(id=video_id)
    video_path = os.path.join(settings.MEDIA_ROOT, video_record.video.name)
    
    with tempfile.TemporaryDirectory() as temp_dir:
        mp4_path = os.path.join(temp_dir, f'{video_id}_converted.mp4')
        subprocess.run([
            'ffmpeg', '-i', video_path, 
            '-c:v', 'libx264', '-preset', 'fast', 
            '-c:a', 'aac', mp4_path
        ])
        
        duration_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', mp4_path
        ]
        duration = float(subprocess.check_output(duration_cmd).decode('utf-8').strip())
        
        segment_duration = 45
        num_segments = int(duration / segment_duration) + (1 if duration % segment_duration > 0 else 0)
        
        for segment in range(num_segments):
            start_time = segment * segment_duration
            
            if segment == num_segments - 1 and duration % segment_duration > 0:
                segment_length = duration % segment_duration
            else:
                segment_length = segment_duration
                
            segment_path = os.path.join(temp_dir, f'segment_{segment}.mp4')
            
            subprocess.run([
                'ffmpeg', '-i', mp4_path, '-ss', str(start_time),
                '-t', str(segment_length), '-c:v', 'copy', '-c:a', 'copy',
                segment_path
            ])
            
            summary = get_gemini_summary(segment_path)
            
            with open(segment_path, 'rb') as video_file:
                segment_data = video_file.read()
                
                filename = f'segment_{video_id}_{segment}.mp4'
                
                summary_obj = VideoSummary(
                    video=video_record,
                    timestamp=int(start_time),
                    summary_text=summary,
                    video_segment=segment_data,
                    segment_name=filename
                )
                summary_obj.save()

def get_gemini_summary(video_path):
    try:
        prompt = "Summarize this 45-second screen recording for study purposes:\n\n"
        prompt += "1. Start by identifying what's it about: \"The screen shows e.g. PDF, jupyter notebook, video, movie, etc.\"\n\n"
        prompt += "2. Extract only what's meaningful:\n"
        prompt += "   - Focus on content visible for 5+ seconds\n"
        prompt += "   - Capture key concepts, terms, and core information\n"
        prompt += "   - Note any content that receives special emphasis or repetition\n"
        prompt += "   - Document any mathematical expressions, technical formulas, or programming syntax\n"
        prompt += "   - Describe significant visual elements or diagrams concisely\n\n"
        prompt += "3. Deliberately omit:\n"
        prompt += "   - Fleeting information or rapidly changing screens\n"
        prompt += "   - Peripheral details not central to the main topic\n\n"
        prompt += "4. Provide minimal contextual framing if the segment appears to be part of a broader subject\n\n"
        prompt += "5. Prioritize information with highest educational value\n\n"
        prompt += "Format your summary in a clear, structured manner optimized for retention and review."

        myfile = client.files.upload(file=video_path)
        print(f"{myfile=}")
        print(f"{video_path=}")
        
        video_bytes = open(video_path, 'rb').read()

        response = client.models.generate_content(
            model='models/gemini-1.5-flash',
            contents=types.Content(
                parts=[
                    types.Part(
                        inline_data=types.Blob(data=video_bytes, mime_type='video/mp4')
                    ),
                    types.Part(text=prompt)
                ]
            )
        )
            
        return response.text
    except Exception as e:
        print(f"Error generating summary. Exception type: {type(e)}, Exception: {repr(e)}")
        return f"Failed to generate summary: {str(e)}"

def get_video_summaries(request, video_id):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET requests are allowed'}, status=405)
        
    try:
        video = VideoRecording.objects.get(id=video_id)
        summaries = VideoSummary.objects.filter(video=video).order_by('timestamp')
        
        result = []
        for summary in summaries:
            video_segment_data = None
            
            if summary.video_segment:
                video_segment_data = f"data:video/mp4;base64,{base64.b64encode(summary.video_segment).decode('utf-8')}"
                
            result.append({
                'timestamp': summary.timestamp,
                'summary': summary.summary_text,
                'video_segment_url': video_segment_data,
                'segment_name': summary.segment_name
            })
        
        return JsonResponse({
            'video_title': video.title,
            'summaries': result
        })
    except VideoRecording.DoesNotExist:
        return JsonResponse({'error': 'Video not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)