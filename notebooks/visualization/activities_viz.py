"""
Activities (Process Data Flow) visualization functions.
"""
import json
import html as html_module
from collections import defaultdict
from IPython.display import HTML, display
from .visualization_utils import find_repo_root, short_from_uri


def display_activities_graphs():
    """Display Activity Data Flow graphs grouped by Process with Mermaid"""
    repo_root = find_repo_root()
    act_path = repo_root / 'build' / 'results' / 'mission-control' / 'activities.json'
    
    with act_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])

    # Group activities by process
    processes_data = defaultdict(lambda: {
        'description': '',
        'nodes': {},
        'edges': {}
    })

    for b in bindings:
        p_uri = b.get('p', {}).get('value')
        p_desc = b.get('pdesc', {}).get('value')
        a1_uri = b.get('a1', {}).get('value')
        a1_desc = b.get('desc1', {}).get('value')
        a2_uri = b.get('a2', {}).get('value')
        a2_desc = b.get('desc2', {}).get('value')
        data_uri = b.get('d', {}).get('value')
        datadesc = b.get('datadesc', {}).get('value')

        p_name = short_from_uri(p_uri)
        a1_name = short_from_uri(a1_uri)
        a2_name = short_from_uri(a2_uri)
        data_name = short_from_uri(data_uri)

        if p_name:
            processes_data[p_name]['description'] = p_desc or ''
            
            if a1_name and a1_name not in processes_data[p_name]['nodes']:
                processes_data[p_name]['nodes'][a1_name] = a1_desc
            if a2_name and a2_name not in processes_data[p_name]['nodes']:
                processes_data[p_name]['nodes'][a2_name] = a2_desc
            
            if a1_name and a2_name:
                processes_data[p_name]['edges'][(a1_name, a2_name)] = (data_name, datadesc)

    # Store for tooltip injection
    activities_processes = {}

    # Create one Mermaid graph for each process
    for process_name, process_info in sorted(processes_data.items()):
        print(f"\n{'='*80}")
        print(f"Process: {process_name}")
        print(f"Description: {process_info['description']}")
        print(f"{'='*80}\n")
        
        # Build Mermaid flowchart (LR = left to right)
        mermaid_code = "graph LR\n"
        
        # Add nodes
        for node_name, node_desc in process_info['nodes'].items():
            safe_name = node_name.replace('"', "'")
            mermaid_code += f'    {node_name}["{safe_name}"]\n'
        
        # Add edges with data labels
        for (a1, a2), (data_name, datadesc) in process_info['edges'].items():
            safe_data_name = data_name.replace('"', "'")
            mermaid_code += f'    {a1} -->|"{safe_data_name}"| {a2}\n'
        
        # Add styling for activity nodes
        mermaid_code += "\n"
        for node_name in process_info['nodes'].keys():
            if node_name.startswith('A') and node_name[1:].isdigit():
                mermaid_code += f'    style {node_name} fill:#ffa07a,stroke:#333,stroke-width:2px\n'
        
        # Store process data for tooltips
        activities_processes[process_name] = {
            'nodes': process_info['nodes'],
            'edges': {f"{a1}->{a2}": {'data': dn, 'description': dd} 
                      for (a1, a2), (dn, dd) in process_info['edges'].items()}
        }
        
        # Render with Mermaid.js
        process_id = process_name.replace(' ', '-')
        mermaid_html = f"""
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'default' }});
</script>

<div style="margin: 20px 0;">
  <h3>{process_name}: {process_info['description']}</h3>
  <div class="mermaid" id="activities-{process_id}">
{html_module.escape(mermaid_code)}
  </div>
  
  <div style="margin-top: 15px; padding: 12px; background: #f5f5f5; border-radius: 5px; display: inline-block;">
    <strong>Legend:</strong>
    <span style="display: inline-block; width: 20px; height: 20px; background: #ffa07a; border: 1px solid #333; margin-left: 10px; margin-right: 8px; vertical-align: middle;"></span>
    <span style="vertical-align: middle;">Activities</span>
  </div>
</div>

<style>
.mermaid {{
    text-align: center;
}}
</style>
"""
        
        display(HTML(mermaid_html))

    print(f"\n✅ Visualized {len(processes_data)} processes")
    return activities_processes


def enable_activities_tooltips(activities_processes):
    """Enable interactive tooltips for activities graphs"""
    import json as json_module
    
    # Build tooltip JavaScript for all processes
    tooltip_js_activities = """
<script>
(function() {
"""

    for process_name, process_data in activities_processes.items():
        process_id = process_name.replace(' ', '-')
        
        tooltip_data_process = {
            'nodes': process_data['nodes'],
            'edges': process_data['edges']
        }
        
        tooltip_js_activities += f"""
    // Tooltips for {process_name}
    (function() {{
        const tooltipData = {json_module.dumps(tooltip_data_process)};
        const processId = 'activities-{process_id}';
        
        function attachTooltips() {{
            const svg = document.querySelector('#' + processId + ' svg');
            if (!svg) {{
                setTimeout(attachTooltips, 500);
                return;
            }}
            
            let tooltip = document.getElementById(processId + '-tooltip');
            if (!tooltip) {{
                tooltip = document.createElement('div');
                tooltip.id = processId + '-tooltip';
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
            
            const nodes = svg.querySelectorAll('g.node');
            nodes.forEach(node => {{
                const nodeId = node.getAttribute('id');
                if (!nodeId) return;
                
                const match = nodeId.match(/flowchart-(.+?)-\\d+/);
                if (!match) return;
                
                const nodeName = match[1];
                if (!tooltipData.nodes[nodeName]) return;
                
                const tooltipContent = `<strong>${{nodeName}}</strong><br>${{tooltipData.nodes[nodeName]}}`;
                
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
            
            const edgeLabels = svg.querySelectorAll('g.edgeLabel');
            edgeLabels.forEach(edgeLabel => {{
                const span = edgeLabel.querySelector('.edgeLabel');
                if (!span) return;
                
                const dataName = span.textContent.trim();
                if (!dataName) return;
                
                for (const [edgeKey, edgeData] of Object.entries(tooltipData.edges)) {{
                    if (edgeData.data === dataName && edgeData.description) {{
                        const tooltipContent = `<strong>${{dataName}}</strong><br>${{edgeData.description}}`;
                        
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

    tooltip_js_activities += """
})();
</script>
"""

    display(HTML(tooltip_js_activities))
    print(f"✅ Interactive tooltips enabled for {len(activities_processes)} activity graphs")
