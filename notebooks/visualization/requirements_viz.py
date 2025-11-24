"""
Requirements visualization functions.
"""
import json
import pandas as pd
from .visualization_utils import find_repo_root, short_from_uri


def load_requirements_table():
    """Load and return requirements as a DataFrame"""
    repo_root = find_repo_root()
    req_path = repo_root / 'build' / 'results' / 'mission-control' / 'requirements.json'
    
    if not req_path.exists():
        raise FileNotFoundError(f"Requirements file not found at {req_path}")

    with req_path.open() as f:
        data = json.load(f)

    bindings = data.get('results', {}).get('bindings', [])
    rows = []

    for b in bindings:
        req_uri = b.get('requirementURI', {}).get('value')
        desc = b.get('description', {}).get('value')
        expr = b.get('expression', {}).get('value')
        stakeholder_uri = b.get('stakeholderURI', {}).get('value')

        name = short_from_uri(req_uri)
        stakeholder = short_from_uri(stakeholder_uri)

        rows.append({
            'Name': name,
            'Description': desc,
            'Expression': expr,
            'Stakeholder': stakeholder
        })

    return pd.DataFrame(rows)
