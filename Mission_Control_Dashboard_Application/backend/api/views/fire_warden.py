from rest_framework.response import Response
from rest_framework.decorators import api_view
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
def fire_warden_chat(request):
    """
    Fire Warden AI chat endpoint.
    Expects JSON body: { "message": "user message text" }
    Returns structured response with type and content.
    """
    message = request.data.get('message', '').strip()
    
    if not message:
        return Response({"error": "Message is required"}, status=400)
    
    logger.info(f"Fire Warden chat request: {message[:100]}")
    
    # Generate response based on keywords
    lowerMessage = message.lower()
    
    if 'status' in lowerMessage or 'situation' in lowerMessage:
        return Response({
            'type': 'text',
            'content': 'Current situation analysis: We have 7 active fires across multiple sectors. Fire F-2 in Sector C is the primary concern due to increasing wind speeds. I recommend deploying additional drones to the northeast perimeter.'
        })
    
    if 'strategy' in lowerMessage or 'plan' in lowerMessage:
        return Response({
            'type': 'plan',
            'content': 'I\'ve analyzed the situation and generated a tactical plan:',
            'plan': {
                'title': 'Sector C Reinforcement Strategy',
                'actions': [
                    'Redeploy Drones D-15, D-18, D-22, D-24 from Sector A to Sector C',
                    'Position drones at coordinates: N42.5°, N43.1°, N43.7°, N44.2°',
                    'Increase water drop frequency to every 90 seconds',
                    'Establish firebreak along northeastern perimeter'
                ],
                'impact': {
                    'containment': '40% faster containment',
                    'eta': '2.5 hours',
                    'successProbability': '87%'
                }
            }
        })
    
    if 'drone' in lowerMessage:
        return Response({
            'type': 'text',
            'content': 'Drone fleet status: 24 of 30 drones are currently active. Average battery level is 78%, average water capacity is 52%. Drones D-06 and D-04 will need to return for refueling within the next 15 minutes.'
        })
    
    if 'weather' in lowerMessage or 'wind' in lowerMessage:
        return Response({
            'type': 'text',
            'content': 'Current weather conditions: Wind speed is 12 mph from the northeast. Forecast shows winds may increase to 18 mph within the next 2 hours. Temperature is 85°F with 15% humidity. These conditions favor rapid fire spread.'
        })
    
    # Default response
    return Response({
        'type': 'text',
        'content': 'I understand your query. Based on current fire patterns and resource availability, I can provide strategic recommendations. Would you like me to analyze a specific sector or generate a comprehensive tactical plan?'
    })
