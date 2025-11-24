"""
Scenarios (Timeline) visualization functions.
"""
import json
import re
from collections import defaultdict
import plotly.graph_objects as go
from .visualization_utils import find_repo_root, short_from_uri, get_tp_order, truncate_lifeline


def display_scenarios():
    """Display Operational Scenarios timeline visualizations"""
    repo_root = find_repo_root()
    scenarios_path = repo_root / 'build' / 'results' / 'mission-control' / 'scenarios.json'
    
    with scenarios_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])

    scenarios_data = defaultdict(lambda: {
        'description': '',
        'lifelines': {},
        'timepoints': defaultdict(lambda: defaultdict(lambda: {'descriptions': set(), 'types': set()}))
    })

    for b in bindings:
        scenario_uri = b.get('scenario', {}).get('value')
        scenario_desc = b.get('scenarioDesc', {}).get('value')
        lifeline_uri = b.get('lifeline', {}).get('value')
        lifeline_desc = b.get('lifelineDesc', {}).get('value')
        timepoint_uri = b.get('timepoint', {}).get('value')
        message_desc = b.get('messageDesc', {}).get('value')
        execution_desc = b.get('executionDesc', {}).get('value')
        state_frag_desc = b.get('stateFragmentDesc', {}).get('value')
        
        scenario_name = short_from_uri(scenario_uri)
        
        if scenario_name:
            scenarios_data[scenario_name]['description'] = scenario_desc or ''
            
            if lifeline_uri:
                lifeline_name = short_from_uri(lifeline_uri)
                
                if lifeline_name not in scenarios_data[scenario_name]['lifelines']:
                    scenarios_data[scenario_name]['lifelines'][lifeline_name] = lifeline_desc or ''
                
                if timepoint_uri:
                    tp_name = short_from_uri(timepoint_uri)
                    event_data = scenarios_data[scenario_name]['timepoints'][tp_name][lifeline_name]
                    
                    if message_desc and message_desc not in event_data['descriptions']:
                        event_data['descriptions'].add(message_desc)
                        event_data['types'].add('message')
                    
                    if execution_desc and execution_desc not in event_data['descriptions']:
                        event_data['descriptions'].add(execution_desc)
                        event_data['types'].add('execution')
                    
                    if state_frag_desc and state_frag_desc not in event_data['descriptions']:
                        event_data['descriptions'].add(state_frag_desc)
                        event_data['types'].add('state')

    # Create visualizations
    for scenario_name, scenario_info in scenarios_data.items():
        if not scenario_info['lifelines']:
            continue
            
        print(f"\n{'='*80}")
        print(f"Scenario: {scenario_name}")
        print(f"Description: {scenario_info['description']}")
        print(f"{'='*80}\n")
        
        lifeline_names = sorted(scenario_info['lifelines'].keys())
        timepoint_names = sorted(scenario_info['timepoints'].keys(), key=get_tp_order)
        
        fig = go.Figure()
        
        num_timepoints = len(timepoint_names)
        num_lifelines = len(lifeline_names)
        
        for i, lifeline_name in enumerate(lifeline_names):
            x_pos = i
            lifeline_desc = scenario_info['lifelines'][lifeline_name]
            truncated_name = truncate_lifeline(lifeline_name)
            
            fig.add_trace(go.Scatter(
                x=[x_pos, x_pos],
                y=[0, num_timepoints + 0.5],
                mode='lines',
                line=dict(color='lightgray', width=2, dash='dot'),
                showlegend=False,
                hoverinfo='skip'
            ))
            
            fig.add_trace(go.Scatter(
                x=[x_pos],
                y=[num_timepoints + 1],
                mode='text',
                text=[f"<b>{truncated_name}</b>"],
                textposition='top center',
                textfont=dict(size=12, color='darkblue'),
                hovertext=f"<b>{lifeline_name}</b><br>{lifeline_desc}",
                hoverinfo='text',
                showlegend=False
            ))
        
        for row_idx, tp_name in enumerate(timepoint_names):
            y_pos = num_timepoints - row_idx
            
            fig.add_annotation(
                x=-0.5,
                y=y_pos,
                text=f"<b>{tp_name}</b>",
                showarrow=False,
                font=dict(size=10, color='darkgreen'),
                xanchor='right',
                yanchor='middle'
            )
            
            for col_idx, lifeline_name in enumerate(lifeline_names):
                x_pos = col_idx
                
                event_data = scenario_info['timepoints'][tp_name].get(lifeline_name, {})
                descriptions = event_data.get('descriptions', set())
                types = event_data.get('types', set())
                
                if descriptions:
                    if 'message' in types:
                        emoji = '📧'
                    elif 'execution' in types:
                        emoji = '⚙️'
                    elif 'state' in types:
                        emoji = '📍'
                    else:
                        emoji = '•'
                    
                    event_parts = [f"{emoji} {desc}" for desc in sorted(descriptions)]
                    combined_text = '<br>'.join(event_parts)
                    
                    fig.add_trace(go.Scatter(
                        x=[x_pos],
                        y=[y_pos],
                        mode='markers',
                        marker=dict(size=15, color='steelblue', symbol='circle', line=dict(width=2, color='darkblue')),
                        hovertext=f"<b>{tp_name}</b> on <b>{lifeline_name}</b><br>{combined_text}",
                        hoverinfo='text',
                        showlegend=False
                    ))
        
        fig.update_layout(
            title=f"<b>{scenario_name}</b><br><sub>{scenario_info['description']}</sub>",
            xaxis=dict(
                showgrid=False,
                showticklabels=False,
                zeroline=False,
                range=[-1, num_lifelines]
            ),
            yaxis=dict(
                showgrid=False,
                showticklabels=False,
                zeroline=False,
                range=[-0.5, num_timepoints + 1.5]
            ),
            plot_bgcolor='white',
            height=300 + (num_timepoints * 50),
            hovermode='closest',
            margin=dict(l=100, r=20, t=100, b=20)
        )
        
        fig.show()

    print(f"\n✅ Visualized {len(scenarios_data)} scenarios")
