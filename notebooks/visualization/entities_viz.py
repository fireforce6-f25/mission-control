"""
Entities (Capability-Entity) visualization functions.
"""
import json
import html as html_module
from IPython.display import HTML, display
from .visualization_utils import find_repo_root, short_from_uri


def display_entities_graph():
    """Display Capability-Entity graph with Mermaid"""
    repo_root = find_repo_root()
    ent_path = repo_root / 'build' / 'results' / 'mission-control' / 'entities.json'
    
    with ent_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])
    nodes = {}
    edges = set()

    for b in bindings:
        cap_uri = b.get('capabilityURI', {}).get('value')
        cap_desc = b.get('capabilityDescription', {}).get('value')
        ent_uri = b.get('entityURI', {}).get('value')
        ent_desc = b.get('entityDescription', {}).get('value')

        cap_name = short_from_uri(cap_uri)
        ent_name = short_from_uri(ent_uri)

        if cap_name and cap_name not in nodes:
            node_type = 'capability' if (cap_name.startswith('C') and cap_name[1:].isdigit()) else 'other'
            nodes[cap_name] = {'description': cap_desc, 'type': node_type}
        if ent_name and ent_name not in nodes:
            nodes[ent_name] = {'description': ent_desc, 'type': 'entity'}
        if cap_name and ent_name:
            edges.add((cap_name, ent_name))

    # Build Mermaid graph
    mermaid_code = "graph LR\n"

    for node_name, node_info in nodes.items():
        safe_name = node_name.replace('"', "'")
        mermaid_code += f'    {node_name}["{safe_name}"]\n'

    for source, target in edges:
        mermaid_code += f'    {source} --> {target}\n'

    mermaid_code += "\n"
    for node_name, node_info in nodes.items():
        if node_info['type'] == 'capability':
            mermaid_code += f'    style {node_name} fill:#87ceeb,stroke:#333,stroke-width:2px\n'
        elif node_info['type'] == 'entity':
            mermaid_code += f'    style {node_name} fill:#90ee90,stroke:#333,stroke-width:2px\n'

    mermaid_html = f"""
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>

<div style="margin: 20px 0;">
  <div class="mermaid" id="entities-graph">
{html_module.escape(mermaid_code)}
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; display: inline-block;">
    <strong>Legend:</strong><br/>
    <div style="margin-top: 8px;">
      <span style="display: inline-block; width: 20px; height: 20px; background: #87ceeb; border: 1px solid #333; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Capabilities (C)</span>
    </div>
    <div style="margin-top: 5px;">
      <span style="display: inline-block; width: 20px; height: 20px; background: #90ee90; border: 1px solid #333; margin-right: 8px; vertical-align: middle;"></span>
      <span style="vertical-align: middle;">Entities</span>
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


def enable_entities_tooltips(nodes):
    """Enable interactive tooltips for entities graph"""
    import json as json_module
    
    tooltip_data_entities = {
        'nodes': {name: info['description'] for name, info in nodes.items()}
    }

    tooltip_js_entities = f"""
<div id="entities-tooltip" style="position: fixed; display: none; background: rgba(0,0,0,0.85); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; pointer-events: none; z-index: 10000; max-width: 300px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>

<script>
(function() {{
    const entitiesTooltipData = {json_module.dumps(tooltip_data_entities)};
    
    function attachEntitiesTooltips() {{
        const svg = document.querySelector('#entities-graph svg');
        if (!svg) {{
            setTimeout(attachEntitiesTooltips, 500);
            return;
        }}
        
        const tooltip = document.getElementById('entities-tooltip');
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
            if (!entitiesTooltipData.nodes[nodeName]) return;
            
            const tooltipContent = `<strong>${{nodeName}}</strong><br>${{entitiesTooltipData.nodes[nodeName]}}`;
            
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
        document.addEventListener('DOMContentLoaded', attachEntitiesTooltips);
    }} else {{
        attachEntitiesTooltips();
    }}
}})();
</script>
"""

    display(HTML(tooltip_js_entities))
    print("✅ Interactive tooltips enabled for entities graph")
