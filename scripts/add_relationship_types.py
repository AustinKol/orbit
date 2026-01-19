#!/usr/bin/env python3
"""
Script to add missing relationship types to companies.json
Adds: CLIENT, SUPPLIER, CREDITOR, DEBTOR, JOINT_VENTURE, LICENSING, SWAPS, BOARD_INTERLOCK
"""

import json
import random
from pathlib import Path

# Path to companies.json
DATA_FILE = Path(__file__).parent.parent / "src" / "data" / "companies.json"

# Relationship type descriptions
RELATIONSHIP_DESCRIPTIONS = {
    "CLIENT": [
        "{target} is a major client of {source}",
        "{source} provides services to {target}",
        "{target} purchases products from {source}",
        "{source} has {target} as a key customer",
        "{target} uses {source}'s platform/services"
    ],
    "SUPPLIER": [
        "{target} supplies components to {source}",
        "{source} sources materials from {target}",
        "{target} is a key supplier for {source}",
        "{source} relies on {target} for manufacturing",
        "{target} provides raw materials to {source}"
    ],
    "CREDITOR": [
        "{source} has extended credit to {target}",
        "{target} has outstanding debt to {source}",
        "{source} is a creditor of {target}",
        "{target} owes money to {source}",
        "{source} provided financing to {target}"
    ],
    "DEBTOR": [
        "{source} owes debt to {target}",
        "{target} is a creditor of {source}",
        "{source} has outstanding loans from {target}",
        "{target} extended credit to {source}",
        "{source} borrowed funds from {target}"
    ],
    "JOINT_VENTURE": [
        "{source} and {target} have a joint venture",
        "{source} and {target} formed a joint venture partnership",
        "Joint venture between {source} and {target}",
        "{source} and {target} collaborate through joint venture",
        "JV partnership: {source} and {target}"
    ],
    "LICENSING": [
        "{source} licenses technology from {target}",
        "{target} has licensing agreement with {source}",
        "{source} uses {target}'s licensed technology",
        "Licensing agreement: {source} and {target}",
        "{target} provides licenses to {source}"
    ],
    "SWAPS": [
        "{source} and {target} have interest rate swap agreements",
        "Currency swap between {source} and {target}",
        "{source} and {target} engage in derivative swaps",
        "Swap agreement: {source} and {target}",
        "{source} has swap contracts with {target}"
    ],
    "BOARD_INTERLOCK": [
        "{source} and {target} share board members",
        "Board interlock between {source} and {target}",
        "{source} and {target} have overlapping board directors",
        "Shared board members: {source} and {target}",
        "Board member overlap: {source} and {target}"
    ]
}

def load_data():
    """Load the companies.json file"""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """Save the updated data back to companies.json"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_company_name(data, company_id):
    """Get company name by ID"""
    for node in data.get('nodes', []):
        if node.get('id') == company_id:
            return node.get('name', company_id)
    return company_id

def add_relationships(data, relationship_type, count=50):
    """Add relationships of a specific type"""
    nodes = data.get('nodes', [])
    links = data.get('links', [])
    
    if len(nodes) < 2:
        print(f"Not enough nodes to create {relationship_type} relationships")
        return
    
    existing_links = {(link.get('source'), link.get('target')): link.get('type', '').upper() 
                     for link in links}
    
    new_links = []
    attempts = 0
    max_attempts = count * 10
    
    while len(new_links) < count and attempts < max_attempts:
        attempts += 1
        source_node = random.choice(nodes)
        target_node = random.choice(nodes)
        
        # Don't create self-loops
        if source_node['id'] == target_node['id']:
            continue
        
        # Check if link already exists
        link_key = (source_node['id'], target_node['id'])
        if link_key in existing_links:
            continue
        
        # Get descriptions for this relationship type
        descriptions = RELATIONSHIP_DESCRIPTIONS.get(relationship_type, [])
        description = random.choice(descriptions).format(
            source=get_company_name(data, source_node['id']),
            target=get_company_name(data, target_node['id'])
        )
        
        new_link = {
            "source": source_node['id'],
            "target": target_node['id'],
            "type": relationship_type.lower(),
            "description": description
        }
        
        # Add data field for certain relationship types
        if relationship_type == "CREDITOR" or relationship_type == "DEBTOR":
            new_link["data"] = {
                "amount": random.randint(1000000, 1000000000),
                "currency": "USD"
            }
        elif relationship_type == "OWNERSHIP":
            new_link["data"] = {
                "pct": random.randint(5, 95)
            }
        elif relationship_type == "JOINT_VENTURE":
            new_link["data"] = {
                "ownership_split": f"{random.randint(30, 70)}/{random.randint(30, 70)}"
            }
        
        new_links.append(new_link)
        existing_links[link_key] = relationship_type
    
    links.extend(new_links)
    data['links'] = links
    print(f"Added {len(new_links)} {relationship_type} relationships")
    return len(new_links)

def main():
    """Main function to add all missing relationship types"""
    print("Loading companies.json...")
    data = load_data()
    
    # Check existing relationship types
    existing_types = set()
    for link in data.get('links', []):
        existing_types.add(link.get('type', '').upper())
    
    print(f"Existing relationship types: {sorted(existing_types)}")
    
    # Missing relationship types to add
    missing_types = [
        "CLIENT",
        "SUPPLIER", 
        "CREDITOR",
        "DEBTOR",
        "JOINT_VENTURE",
        "LICENSING",
        "SWAPS",
        "BOARD_INTERLOCK"
    ]
    
    print(f"\nAdding missing relationship types...")
    total_added = 0
    
    for rel_type in missing_types:
        if rel_type in existing_types:
            print(f"{rel_type} already exists, skipping...")
            continue
        
        added = add_relationships(data, rel_type, count=60)
        total_added += added
    
    print(f"\nTotal new relationships added: {total_added}")
    
    # Save the updated data
    print("Saving updated companies.json...")
    save_data(data)
    print("Done!")

if __name__ == "__main__":
    main()
