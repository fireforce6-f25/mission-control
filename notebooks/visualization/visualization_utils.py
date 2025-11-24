"""
Utility functions for Mission Control visualizations.
"""
import json
import pathlib
import pandas as pd
import networkx as nx
import plotly.graph_objects as go
import plotly.io as pio
from collections import defaultdict
import re
from IPython.display import HTML, display
import html as html_module


def find_repo_root(start=pathlib.Path.cwd()):
    """Find the repository root by looking for build.gradle or .git"""
    for cand in [start] + list(start.parents):
        if (cand / 'build.gradle').exists() or (cand / '.git').exists():
            return cand
    return pathlib.Path.cwd()


def short_from_uri(u):
    """Extract short name from URI (fragment after # or last path segment)"""
    if not u:
        return ''
    if '#' in u:
        return u.split('#')[-1]
    return u.rstrip('/').split('/')[-1]


def get_tp_order(tp_name):
    """Extract numeric order from timepoint names"""
    match = re.search(r'(\d+)$', tp_name)
    return int(match.group(1)) if match else 0


def truncate_lifeline(name, max_len=20):
    """Truncate long names for display"""
    if len(name) <= max_len:
        return name
    return name[:max_len-3] + '...'


def configure_plotly_for_export():
    """Configure Plotly for nbconvert HTML export"""
    pio.renderers.default = "notebook_connected"
