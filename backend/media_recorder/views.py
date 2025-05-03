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

client = genai.Client(
    api_key=os.getenv('GEMINI_API_KEY'),
    http_options=types.HttpOptions(api_version='v1alpha')
)

model = client.models.get('gemini-1.5-flash')

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
        
        # Get video duration using ffprobe
        duration_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', mp4_path
        ]
        duration = float(subprocess.check_output(duration_cmd).decode('utf-8').strip())
        
        # Calculate number of segments (60 seconds each)
        segment_duration = 60
        num_segments = int(duration / segment_duration) + (1 if duration % segment_duration > 0 else 0)
        
        for segment in range(num_segments):
            start_time = segment * segment_duration
            
            # For the last segment, calculate the remaining duration
            if segment == num_segments - 1 and duration % segment_duration > 0:
                segment_length = duration % segment_duration
            else:
                segment_length = segment_duration
                
            # Generate segment file path
            segment_path = os.path.join(temp_dir, f'segment_{segment}.mp4')
            
            # Use ffmpeg to extract the segment
            subprocess.run([
                'ffmpeg', '-i', mp4_path, '-ss', str(start_time),
                '-t', str(segment_length), '-c:v', 'copy', '-c:a', 'copy',
                segment_path
            ])
            
            # Generate a simple text summary based on segment number and timestamp
            summary = f"Video segment {segment+1} (from {start_time}s to {start_time + segment_length}s)"
            
            # Read the segment file as binary data
            with open(segment_path, 'rb') as video_file:
                segment_data = video_file.read()
                
                filename = f'segment_{video_id}_{segment}.mp4'
                
                # Save to database
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
        prompt = (
            "Analyze this screenshot as a digital learning environment. "
            "Focus only on meaningful textual or visual learning content.\n\n"
            "Do not describe UI elements such as browser tabs, toolbars, buttons, "
            "or menus unless they directly display important content.\n\n"
            "Your response must be in the form of bullet points only. Each bullet "
            "should summarize one piece of relevant information.\n\n"
            "Include bullet points for:\n\n"
            "Content from any visible PDF (e.g., textbook pages, research articles, assignments)\n\n"
            "Content from a Jupyter notebook (.ipynb) (e.g., code cells, output, markdown explanations)\n\n"
            "Content from any video (type and topic of the video, based on visible frame or captions)\n\n"
            "Any readable text on screen (e.g., article excerpts, notes, code comments, subtitles)\n\n"
            "Any other important visual or textual learning material\n\n"
            "End with a brief set of bullet points summarizing what the user is most likely studying or working on, "
            "based on all visible content."
        )

        file = client.files.upload(file=video_path)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[
                prompt,
                file
            ]
        )
        
        return response.text
    except Exception as e:
        print(f"Error generating summary. Exception type: {type(e)}, Exception: {repr(e)}")
        return "Failed to generate summary"

def get_video_summaries(request, video_id):
    # Only allow GET requests
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