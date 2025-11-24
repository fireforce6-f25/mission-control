"""
State Machine visualization functions.
"""
import json
import html as html_module
from IPython.display import HTML, display
from .visualization_utils import find_repo_root, short_from_uri


def display_statemachine():
    """Display State Machine diagram with Mermaid"""
    repo_root = find_repo_root()
    sm_path = repo_root / 'build' / 'results' / 'mission-control' / 'statemachine.json'
    
    with sm_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])
    nodes = {}
    edges = {}

    for b in bindings:
        s1_uri = b.get('s1', {}).get('value')
        s1_desc = b.get('s1desc', {}).get('value')
        s2_uri = b.get('s2', {}).get('value')
        s2_desc = b.get('s2desc', {}).get('value')
        trigger_uri = b.get('trigger', {}).get('value')
        trigger_desc = b.get('triggerdesc', {}).get('value')

        s1_name = short_from_uri(s1_uri)
        s2_name = short_from_uri(s2_uri)
        trigger_name = short_from_uri(trigger_uri) if trigger_uri else None

        if s1_name and s1_name not in nodes:
            nodes[s1_name] = s1_desc
        if s2_name and s2_name not in nodes:
            nodes[s2_name] = s2_desc
        
        if s1_name and s2_name:
            edges[(s1_name, s2_name)] = (trigger_name, trigger_desc)

    # Build Mermaid code
    mermaid_code = "stateDiagram-v2\n"
    mermaid_code += "    direction LR\n\n"

    for (s1, s2), (trigger_name, trigger_desc) in edges.items():
        if trigger_name:
            clean_trigger = trigger_name.replace('"', "'")
            mermaid_code += f'    {s1} --> {s2} : {clean_trigger}\n'
        else:
            mermaid_code += f'    {s1} --> {s2}\n'

    mermaid_html = f"""
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>

<div class="mermaid" id="state-machine-diagram">
{html_module.escape(mermaid_code)}
</div>

<style>
.mermaid {{
    text-align: center;
    margin: 20px 0;
}}
</style>
"""

    display(HTML(mermaid_html))
    return nodes, edges


def enable_statemachine_tooltips(nodes, edges):
    """Enable interactive tooltips for state machine"""
    import json as json_module
    
    tooltip_data = {
        'nodes': {name: desc for name, desc in nodes.items()},
        'edges': {f"{s1}->{s2}": {'trigger': tn or '', 'description': td or ''} 
                  for (s1, s2), (tn, td) in edges.items()}
    }

    tooltip_js = f"""
<div id="sm-tooltip" style="position: fixed; display: none; background: rgba(0,0,0,0.85); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>

<script>
(function() {{
    const smTooltipData = {json_module.dumps(tooltip_data)};
    
    function attachMermaidTooltips() {{
        const svg = document.querySelector('#state-machine-diagram svg');
        if (!svg) {{
            setTimeout(attachMermaidTooltips, 500);
            return;
        }}
        
        const tooltip = document.getElementById('sm-tooltip');
        if (!tooltip) return;
        
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
            if (!stateName || !smTooltipData.nodes[stateName]) return;
            
            const tooltipContent = `<strong>${{stateName}}</strong><br>${{smTooltipData.nodes[stateName]}}`;
            
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
            
            for (const [edgeKey, edgeData] of Object.entries(smTooltipData.edges)) {{
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
        document.addEventListener('DOMContentLoaded', attachMermaidTooltips);
    }} else {{
        attachMermaidTooltips();
    }}
}})();
</script>
"""

    display(HTML(tooltip_js))
    print("✅ Interactive tooltips enabled for state machine diagram")
