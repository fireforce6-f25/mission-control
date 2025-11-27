"""
State Machine visualization functions.
"""
import json
import html as html_module
from collections import defaultdict
from IPython.display import HTML, display
from .visualization_utils import find_repo_root, short_from_uri


def display_statemachine():
    """Display State Machine diagrams with Mermaid (one per state machine)"""
    repo_root = find_repo_root()
    sm_path = repo_root / 'build' / 'results' / 'mission-control' / 'statemachine.json'
    
    with sm_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])
    
    # Group by state machine
    statemachines_data = defaultdict(lambda: {
        'description': '',
        'nodes': {},
        'edges': {}
    })

    for b in bindings:
        sm_uri = b.get('sm', {}).get('value')
        sm_desc = b.get('smdesc', {}).get('value')
        s1_uri = b.get('s1', {}).get('value')
        s1_desc = b.get('s1desc', {}).get('value')
        s2_uri = b.get('s2', {}).get('value')
        s2_desc = b.get('s2desc', {}).get('value')
        trigger_uri = b.get('trigger', {}).get('value')
        trigger_desc = b.get('triggerdesc', {}).get('value')

        sm_name = short_from_uri(sm_uri)
        s1_name = short_from_uri(s1_uri)
        s2_name = short_from_uri(s2_uri)
        trigger_name = short_from_uri(trigger_uri) if trigger_uri else None

        if sm_name:
            statemachines_data[sm_name]['description'] = sm_desc or ''
            
            if s1_name and s1_name not in statemachines_data[sm_name]['nodes']:
                statemachines_data[sm_name]['nodes'][s1_name] = s1_desc
            if s2_name and s2_name not in statemachines_data[sm_name]['nodes']:
                statemachines_data[sm_name]['nodes'][s2_name] = s2_desc
            
            if s1_name and s2_name:
                statemachines_data[sm_name]['edges'][(s1_name, s2_name)] = (trigger_name, trigger_desc)

    # Store for tooltip injection
    statemachines_dict = {}

    # Create one Mermaid diagram for each state machine
    for sm_name, sm_info in sorted(statemachines_data.items()):
        print(f"\n{'='*80}")
        print(f"State Machine: {sm_name}")
        print(f"Description: {sm_info['description']}")
        print(f"{'='*80}\n")
        
        # Build Mermaid code
        mermaid_code = "stateDiagram-v2\n"
        mermaid_code += "    direction LR\n\n"

        for (s1, s2), (trigger_name, trigger_desc) in sm_info['edges'].items():
            if trigger_name:
                clean_trigger = trigger_name.replace('"', "'")
                mermaid_code += f'    {s1} --> {s2} : {clean_trigger}\n'
            else:
                mermaid_code += f'    {s1} --> {s2}\n'

        # Store for tooltips
        statemachines_dict[sm_name] = {
            'nodes': sm_info['nodes'],
            'edges': {f"{s1}->{s2}": {'trigger': tn or '', 'description': td or ''} 
                      for (s1, s2), (tn, td) in sm_info['edges'].items()}
        }

        sm_id = sm_name.replace(' ', '-')
        mermaid_html = f"""
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>

<div style="margin: 20px 0;">
  <h3>{sm_name}: {sm_info['description']}</h3>
  <div class="mermaid" id="state-machine-{sm_id}">
{html_module.escape(mermaid_code)}
  </div>
</div>

<style>
.mermaid {{
    text-align: center;
    margin: 20px 0;
}}
</style>
"""

        display(HTML(mermaid_html))

    print(f"\n✅ Visualized {len(statemachines_data)} state machines")
    return statemachines_dict


def enable_statemachine_tooltips(statemachines_dict):
    """Enable interactive tooltips for state machine diagrams"""
    import json as json_module
    
    # Build tooltip JavaScript for all state machines
    tooltip_js = """
<script>
(function() {
"""

    for sm_name, sm_data in statemachines_dict.items():
        sm_id = sm_name.replace(' ', '-')
        
        tooltip_data = {
            'nodes': sm_data['nodes'],
            'edges': sm_data['edges']
        }
        
        tooltip_js += f"""
    // Tooltips for {sm_name}
    (function() {{
        const tooltipData = {json_module.dumps(tooltip_data)};
        const smId = 'state-machine-{sm_id}';
        
        function attachTooltips() {{
            const svg = document.querySelector('#' + smId + ' svg');
            if (!svg) {{
                setTimeout(attachTooltips, 500);
                return;
            }}
            
            let tooltip = document.getElementById(smId + '-tooltip');
            if (!tooltip) {{
                tooltip = document.createElement('div');
                tooltip.id = smId + '-tooltip';
                tooltip.style.cssText = 'position: fixed; display: none; background: rgba(0,0,0,0.85); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
                document.body.appendChild(tooltip);
            }}
            
            function showTooltip(content, e) {{
                tooltip.innerHTML = content;
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }}
            
            function hideTooltip() {{
                tooltip.style.display = 'none';
            }}
            
            function updateTooltipPosition(e) {{
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }}
            
            const states = svg.querySelectorAll('g.node');
            states.forEach(state => {{
                const stateName = state.getAttribute('data-id');
                if (!stateName || !tooltipData.nodes[stateName]) return;
                
                const tooltipContent = `<strong>${{stateName}}</strong><br>${{tooltipData.nodes[stateName]}}`;
                
                const rect = state.querySelector('rect.basic');
                const textElements = state.querySelectorAll('text, foreignObject');
                
                if (rect) {{
                    rect.style.cursor = 'pointer';
                    rect.addEventListener('mouseenter', (e) => showTooltip(tooltipContent, e));
                    rect.addEventListener('mousemove', updateTooltipPosition);
                    rect.addEventListener('mouseleave', hideTooltip);
                }}
                
                textElements.forEach(textEl => {{
                    textEl.style.cursor = 'pointer';
                    textEl.addEventListener('mouseenter', (e) => showTooltip(tooltipContent, e));
                    textEl.addEventListener('mousemove', updateTooltipPosition);
                    textEl.addEventListener('mouseleave', hideTooltip);
                }});
            }});
            
            const edgeLabels = svg.querySelectorAll('g.edgeLabel');
            edgeLabels.forEach(edgeLabel => {{
                const span = edgeLabel.querySelector('.edgeLabel');
                if (!span) return;
                
                const triggerName = span.textContent.trim();
                if (!triggerName) return;
                
                for (const [edgeKey, edgeData] of Object.entries(tooltipData.edges)) {{
                    if (edgeData.trigger === triggerName && edgeData.description) {{
                        const tooltipContent = `<strong>${{triggerName}}</strong><br>${{edgeData.description}}`;
                        
                        const rect = edgeLabel.querySelector('rect');
                        const textElements = edgeLabel.querySelectorAll('text, foreignObject');
                        
                        if (rect) {{
                            rect.style.cursor = 'pointer';
                            rect.addEventListener('mouseenter', (e) => showTooltip(tooltipContent, e));
                            rect.addEventListener('mousemove', updateTooltipPosition);
                            rect.addEventListener('mouseleave', hideTooltip);
                        }}
                        
                        textElements.forEach(textEl => {{
                            textEl.style.cursor = 'pointer';
                            textEl.addEventListener('mouseenter', (e) => showTooltip(tooltipContent, e));
                            textEl.addEventListener('mousemove', updateTooltipPosition);
                            textEl.addEventListener('mouseleave', hideTooltip);
                        }});
                        break;
                    }}
                }}
            }});
        }}
        
        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', attachTooltips);
        }} else {{
            attachTooltips();
        }}
    }})();
"""

    tooltip_js += """
})();
</script>
"""

    display(HTML(tooltip_js))
    print(f"✅ Interactive tooltips enabled for {len(statemachines_dict)} state machine diagrams")
