"""
Mission Control Visualization Package

This package contains all visualization functions for the Mission Control report.
"""

from .visualization_utils import (
    find_repo_root,
    short_from_uri,
    get_tp_order,
    truncate_lifeline,
    configure_plotly_for_export
)

from .requirements_viz import load_requirements_table
from .missions_viz import display_missions_graph, enable_missions_tooltips
from .entities_viz import display_entities_graph, enable_entities_tooltips
from .activities_viz import display_activities_graphs, enable_activities_tooltips
from .statemachine_viz import display_statemachine, enable_statemachine_tooltips
from .scenarios_viz import display_scenarios

__all__ = [
    # Utils
    'find_repo_root',
    'short_from_uri',
    'get_tp_order',
    'truncate_lifeline',
    'configure_plotly_for_export',
    # Requirements
    'load_requirements_table',
    # Missions
    'display_missions_graph',
    'enable_missions_tooltips',
    # Entities
    'display_entities_graph',
    'enable_entities_tooltips',
    # Activities
    'display_activities_graphs',
    'enable_activities_tooltips',
    # State Machine
    'display_statemachine',
    'enable_statemachine_tooltips',
    # Scenarios
    'display_scenarios',
]
