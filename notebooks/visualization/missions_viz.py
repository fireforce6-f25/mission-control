"""
Missions (Requirements-Capability) visualization functions.
"""
import json
import html as html_module
from IPython.display import HTML, display
from .visualization_utils import find_repo_root, short_from_uri


def display_missions_graph(requirements_df):
    """Display Requirements-Capability-SubCapability graph with Mermaid"""
    repo_root = find_repo_root()
    cap_path = repo_root / 'build' / 'results' / 'mission-control' / 'missions_capabilities.json'
    
    with cap_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])
    nodes = {}
    edges = set()

    # Load requirement expressions from requirements DataFrame
    req_expressions = {}
    for _, row in requirements_df.iterrows():
        req_expressions[row['Name']] = row['Expression']

    for b in bindings:
        req_uri = b.get('requirementURI', {}).get('value')
        req_desc = b.get('requirementDescription', {}).get('value')
        cap_uri = b.get('capabilityURI', {}).get('value')
        cap_desc = b.get('capabilityDescription', {}).get('value')
        sub_uri = b.get('subCapabilityURI', {}).get('value')
        sub_desc = b.get('subCapabilityDescription', {}).get('value')

        req_name = short_from_uri(req_uri)
        cap_name = short_from_uri(cap_uri)
        sub_name = short_from_uri(sub_uri) if sub_uri else None

        if req_name and req_name not in nodes:
            req_expr = req_expressions.get(req_name, '')
            nodes[req_name] = {
                'description': req_desc, 
                'type': 'requirement',
                'expression': req_expr
            }
        if cap_name and cap_name not in nodes:
            nodes[cap_name] = {'description': cap_desc, 'type': 'capability'}
        if sub_name and sub_name not in nodes:
            nodes[sub_name] = {'description': sub_desc, 'type': 'subcapability'}

        if req_name and cap_name:
            edges.add((req_name, cap_name))
        if cap_name and sub_name:
            edges.add((cap_name, sub_name))

    # Build Mermaid graph
    mermaid_code = "graph LR\n"

    for node_name, node_info in nodes.items():
        safe_name = node_name.replace('"', "'")
        mermaid_code += f'    {node_name}["{safe_name}"]\n'

    for source, target in edges:
        mermaid_code += f'    {source} --> {target}\n'

    mermaid_code += "\n"
    for node_name, node_info in nodes.items():
        if node_info['type'] == 'requirement':
            mermaid_code += f'    style {node_name} fill:#f08080,stroke:#333,stroke-width:2px\n'
        elif node_info['type'] == 'capability':
            mermaid_code += f'    style {node_name} fill:#87ceeb,stroke:#333,stroke-width:2px\n'
        elif node_info['type'] == 'subcapability':
            mermaid_code += f'    style {node_name} fill:#add8e6,stroke:#333,stroke-width:2px\n'

    mermaid_html = f"""
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>

<div style="margin: 20px 0;">
  <div class="mermaid" id="missions-graph">
{html_module.escape(mermaid_code)}
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; display: inline-block;">
    <strong>Legend:</strong><br/>
    <div style="margin-top: 8px;">
      <span style="display: inline-block; width: 20px; height: 20px; background: #f08080; border: 1px solid #333; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Requirements (R)</span>
    </div>
    <div style="margin-top: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background: #87ceeb; border: 1px solid #333; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Capabilities (C)</span>
    </div>
    <div style="margin-top: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background: #add8e6; border: 1px solid #333; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Sub-Capabilities</span>
    </div>
  </div>
</div>

<style>
.mermaid {{
    text-align: center;
}}
</style>
"""

    display(HTML(mermaid_html))
    return nodes


def enable_missions_tooltips(nodes):
    """Enable interactive tooltips for missions graph"""
    import json as json_module
    
    tooltip_data_missions = {'nodes': {}}
    for name, info in nodes.items():
        if info['type'] == 'requirement' and info.get('expression'):
            tooltip_data_missions['nodes'][name] = f"{info['description']}<br><br><em>Expression:</em> {info['expression']}"
        else:
            tooltip_data_missions['nodes'][name] = info['description']

    tooltip_js_missions = f"""
<div id="missions-tooltip" style="position: fixed; display: none; background: rgba(0,0,0,0.85); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>

<script>
(function() {{
    const missionsTooltipData = {json_module.dumps(tooltip_data_missions)};
    
    function attachMissionsTooltips() {{
        const svg = document.querySelector('#missions-graph svg');
        if (!svg) {{
            setTimeout(attachMissionsTooltips, 500);
            return;
        }}
        
        const tooltip = document.getElementById('missions-tooltip');
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
        
        const nodes = svg.querySelectorAll('g.node');
        nodes.forEach(node => {{
            const nodeId = node.getAttribute('id');
            if (!nodeId) return;
            
            const match = nodeId.match(/flowchart-(.+?)-\\d+/);
            if (!match) return;
            
            const nodeName = match[1];
            if (!missionsTooltipData.nodes[nodeName]) return;
            
            const tooltipContent = `<strong>${{nodeName}}</strong><br>${{missionsTooltipData.nodes[nodeName]}}`;
            
            const rect = node.querySelector('rect, polygon, circle, ellipse');
            const textElements = node.querySelectorAll('text, foreignObject');
            
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
    }}
    
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', attachMissionsTooltips);
    }} else {{
        attachMissionsTooltips();
    }}
}})();
</script>
"""

    display(HTML(tooltip_js_missions))
    print("✅ Interactive tooltips enabled for missions graph")
