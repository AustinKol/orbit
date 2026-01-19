import json
import random

# Comprehensive list of real companies
tech_companies = [
    'Apple Inc.', 'Microsoft Corporation', 'Alphabet Inc.', 'Amazon.com Inc.', 'Meta Platforms Inc.',
    'NVIDIA Corporation', 'Tesla Inc.', 'Oracle Corporation', 'Adobe Inc.', 'Salesforce.com Inc.',
    'Intel Corporation', 'Cisco Systems Inc.', 'IBM Corporation', 'Netflix Inc.', 'PayPal Holdings Inc.',
    'Uber Technologies Inc.', 'Zoom Video Communications', 'Spotify Technology', 'Snap Inc.', 'Twitter Inc.',
    'Pinterest Inc.', 'Square Inc.', 'Shopify Inc.', 'ServiceNow Inc.', 'Workday Inc.',
    'Snowflake Inc.', 'Palantir Technologies', 'CrowdStrike Holdings', 'Zscaler Inc.', 'Okta Inc.',
    'Datadog Inc.', 'Twilio Inc.', 'Atlassian Corporation', 'Splunk Inc.', 'VMware Inc.',
    'Qualcomm Inc.', 'Broadcom Inc.', 'AMD', 'Micron Technology', 'Applied Materials',
    'Lam Research', 'ASML Holding', 'Taiwan Semiconductor', 'Samsung Electronics', 'Sony Corporation',
    'LG Electronics', 'Panasonic Corporation', 'Canon Inc.', 'Nikon Corporation', 'HP Inc.',
    'Dell Technologies', 'Lenovo Group', 'Xiaomi Corporation', 'Huawei Technologies', 'Tencent Holdings',
    'Alibaba Group', 'Baidu Inc.', 'JD.com Inc.', 'Meituan', 'ByteDance Ltd.',
    'Sea Limited', 'Grab Holdings', 'Rakuten Inc.', 'MercadoLibre', 'Naspers Limited',
    'Yandex N.V.', 'Mail.ru Group', 'SAP SE', 'Infosys Limited', 'Wipro Limited',
    'Tata Consultancy Services', 'Accenture plc', 'Cognizant Technology', 'DXC Technology', 'Capgemini SE',
    'Atos SE', 'NTT Data Corporation', 'Fujitsu Limited', 'Hitachi Ltd.', 'NEC Corporation',
    'Toshiba Corporation', 'Sharp Corporation', 'Kyocera Corporation', 'TDK Corporation', 'Murata Manufacturing',
    'Foxconn Technology', 'Pegatron Corporation', 'Quanta Computer', 'Compal Electronics', 'Wistron Corporation',
    'Inventec Corporation', 'Flextronics International', 'Jabil Inc.', 'Sanmina Corporation', 'Celestica Inc.',
    'Benchmark Electronics', 'Plexus Corp.', 'TTM Technologies', 'Viasystems Group', 'Tripod Technology',
    'Unimicron Technology', 'Compeq Manufacturing', 'Zhen Ding Technology', 'AT&S Austria', 'Ibiden Co. Ltd.',
    'Mektron Corporation', 'Young Poong Corporation', 'Flex Ltd.', 'Amphenol Corporation', 'TE Connectivity',
    'Molex Incorporated', 'Amphenol Corporation', '3M Company', 'Corning Incorporated', 'Emerson Electric',
    'Honeywell International', 'Rockwell Automation', 'Schneider Electric', 'Siemens AG', 'ABB Ltd.',
    'General Electric', 'Eaton Corporation', 'Parker Hannifin', 'Illinois Tool Works', 'Dover Corporation',
    'Pentair plc', 'Flowserve Corporation', 'Ingersoll Rand', 'Gardner Denver', 'Atlas Copco',
    'Sandvik AB', 'Metso Outotec', 'FLSmidth & Co.', 'Konecranes', 'Cargotec Corporation',
    'Wärtsilä Corporation', 'MAN Energy Solutions', 'Rolls-Royce Holdings', 'Safran SA', 'Thales Group',
    'Leonardo S.p.A.', 'BAE Systems', 'Lockheed Martin', 'Boeing Company', 'Northrop Grumman',
    'Raytheon Technologies', 'General Dynamics', 'L3Harris Technologies', 'Textron Inc.', 'Huntington Ingalls',
    'Leidos Holdings', 'Booz Allen Hamilton', 'CACI International', 'ManTech International', 'Science Applications',
    'Jacobs Engineering', 'AECOM Technology', 'Fluor Corporation', 'KBR Inc.', 'Tetra Tech',
    'Stantec Inc.', 'WSP Global Inc.', 'Aecom Technology', 'Parsons Corporation', 'Vectrus Inc.',
    'V2X Inc.', 'Cubic Corporation', 'Mercury Systems', 'Ultra Electronics', 'Curtiss-Wright',
    'Moog Inc.', 'TransDigm Group', 'Heico Corporation', 'AAR Corp.', 'Triumph Group',
    'Spirit AeroSystems', 'Hexcel Corporation', 'Cytec Industries', 'Toray Industries', 'Teijin Limited',
    'Mitsubishi Chemical', 'Sumitomo Chemical', 'Asahi Kasei', 'Toray Industries', 'Teijin Limited',
    'Kuraray Co. Ltd.', 'Ube Industries', 'Mitsui Chemicals', 'Shin-Etsu Chemical', 'Tokuyama Corporation',
    'DIC Corporation', 'Sekisui Chemical', 'Nippon Shokubai', 'Kao Corporation', 'Lion Corporation',
    'Unilever plc', 'Procter & Gamble', 'Colgate-Palmolive', 'Kimberly-Clark', 'Johnson & Johnson',
    'Reckitt Benckiser', 'Henkel AG', 'Beiersdorf AG', 'L\'Oréal SA', 'Estée Lauder Companies',
    'Coty Inc.', 'Revlon Inc.', 'Avon Products', 'Mary Kay Inc.', 'Amway Corporation',
    'Herbalife Nutrition', 'Nu Skin Enterprises', 'USANA Health Sciences', 'Nature\'s Sunshine', 'Mannatech',
    'Forever Living Products', 'Young Living', 'doTERRA', 'Rodan + Fields', 'Beachbody Company',
    'Medifast Inc.', 'Weight Watchers', 'WW International', 'Nutrisystem Inc.', 'Jenny Craig',
    'Atkins Nutritionals', 'South Beach Diet', 'Zone Diet', 'Paleo Diet', 'Keto Diet',
    'Vegan Diet', 'Vegetarian Diet', 'Mediterranean Diet', 'DASH Diet', 'MIND Diet',
    'Flexitarian Diet', 'Intermittent Fasting', 'Whole30', 'Clean Eating', 'Raw Food Diet',
    'Macrobiotic Diet', 'Ayurvedic Diet', 'Chinese Medicine Diet', 'Japanese Diet', 'Korean Diet',
    'Indian Diet', 'Thai Diet', 'Vietnamese Diet', 'Filipino Diet', 'Indonesian Diet',
    'Malaysian Diet', 'Singaporean Diet', 'Australian Diet', 'New Zealand Diet', 'South African Diet',
    'Brazilian Diet', 'Mexican Diet', 'Argentine Diet', 'Chilean Diet', 'Peruvian Diet',
    'Colombian Diet', 'Venezuelan Diet', 'Ecuadorian Diet', 'Bolivian Diet', 'Paraguayan Diet',
    'Uruguayan Diet', 'Guyanese Diet', 'Surinamese Diet', 'French Guiana Diet', 'Caribbean Diet',
    'Jamaican Diet', 'Cuban Diet', 'Dominican Diet', 'Haitian Diet', 'Puerto Rican Diet',
    'Trinidadian Diet', 'Barbadian Diet', 'Bahamian Diet', 'Belizean Diet', 'Costa Rican Diet',
    'Panamanian Diet', 'Nicaraguan Diet', 'Honduran Diet', 'Guatemalan Diet', 'El Salvadoran Diet',
]

finance_companies = [
    'JPMorgan Chase & Co.', 'Bank of America Corp.', 'Wells Fargo & Company', 'Citigroup Inc.', 'Goldman Sachs Group',
    'Morgan Stanley', 'Charles Schwab Corp.', 'U.S. Bancorp', 'PNC Financial Services', 'Truist Financial',
    'Capital One Financial', 'American Express Co.', 'Discover Financial', 'Synchrony Financial', 'Ally Financial Inc.',
    'Fifth Third Bancorp', 'KeyCorp', 'Huntington Bancshares', 'Regions Financial Corp.', 'M&T Bank Corporation',
    'First Republic Bank', 'SVB Financial Group', 'East West Bancorp', 'Zions Bancorporation', 'Comerica Incorporated',
    'Cullen/Frost Bankers', 'People\'s United Financial', 'New York Community Bancorp', 'Signature Bank', 'Western Alliance Bancorp',
    'First Horizon Corporation', 'Valley National Bancorp', 'Associated Banc-Corp', 'F.N.B. Corporation', 'BancorpSouth Bank',
    'First Citizens BancShares', 'First National of Nebraska', 'Fulton Financial Corporation', 'UMB Financial Corporation', 'Commerce Bancshares',
    'TCF Financial Corporation', 'BOK Financial Corporation', 'Wintrust Financial', 'First Midwest Bancorp', 'Old National Bancorp',
    'United Community Banks', 'Home BancShares Inc.', 'Prosperity Bancshares', 'SouthState Corporation', 'Pinnacle Financial Partners',
    'First Financial Bankshares', 'Texas Capital Bancshares', 'Independent Bank Group', 'Cadence Bank', 'Simmons First National',
    'BancFirst Corporation', 'First Interstate BancSystem', 'First Hawaiian Inc.', 'First Merchants Corporation', 'First Bancorp',
    'First Commonwealth Financial', 'First Mid Bancshares', 'First National Corporation', 'First Northwest Bancorp', 'First of Long Island Corp',
    'First Savings Financial', 'First United Corporation', 'First Western Financial', 'FirstBank Holding Company', 'Flagstar Bancorp Inc.',
    'FleetCor Technologies', 'FNB Corporation', 'FNCB Bancorp Inc.', 'FNB Bancorp', 'FNB Financial Services',
    'FNCB Bancorp', 'FNB Corporation', 'FNB Bancorp', 'FNB Financial Services', 'FNCB Bancorp',
    'Berkshire Hathaway', 'BlackRock Inc.', 'Vanguard Group', 'State Street Corporation', 'BNY Mellon',
    'Northern Trust Corporation', 'T. Rowe Price Group', 'Franklin Resources', 'Invesco Ltd.', 'Janus Henderson Group',
    'Legg Mason Inc.', 'Eaton Vance Corp.', 'AllianceBernstein', 'Federated Hermes', 'Cohen & Steers',
    'GAMCO Investors', 'Guggenheim Partners', 'Oaktree Capital', 'Apollo Global Management', 'KKR & Co.',
    'Blackstone Group', 'Carlyle Group', 'TPG Capital', 'Bain Capital', 'Warburg Pincus',
    'Silver Lake Partners', 'General Atlantic', 'Insight Partners', 'Andreessen Horowitz', 'Sequoia Capital',
    'Kleiner Perkins', 'Greylock Partners', 'Accel Partners', 'Benchmark Capital', 'First Round Capital',
    'Union Square Ventures', 'Foundry Group', 'True Ventures', 'Spark Capital', 'Matrix Partners',
    'Battery Ventures', 'General Catalyst', 'Lightspeed Venture Partners', 'New Enterprise Associates', 'Institutional Venture Partners',
    'Redpoint Ventures', 'Mayfield Fund', 'Norwest Venture Partners', 'Sutter Hill Ventures', 'Greylock Partners',
    'Index Ventures', 'Atomico', 'Balderton Capital', 'Accel Partners', 'Bessemer Venture Partners',
    'Insight Partners', 'General Catalyst', 'Lightspeed Venture Partners', 'New Enterprise Associates', 'Institutional Venture Partners',
]

healthcare_companies = [
    'Johnson & Johnson', 'UnitedHealth Group', 'Pfizer Inc.', 'AbbVie Inc.', 'Merck & Co. Inc.',
    'Bristol-Myers Squibb', 'Eli Lilly and Company', 'Amgen Inc.', 'Gilead Sciences Inc.', 'Regeneron Pharmaceuticals',
    'Biogen Inc.', 'Vertex Pharmaceuticals', 'Moderna Inc.', 'BioNTech SE', 'Novavax Inc.',
    'Incyte Corporation', 'Alexion Pharmaceuticals', 'Seagen Inc.', 'Illumina Inc.', 'Thermo Fisher Scientific',
    'Danaher Corporation', 'Abbott Laboratories', 'Medtronic plc', 'Boston Scientific', 'Stryker Corporation',
    'Becton Dickinson', 'Baxter International', 'Zimmer Biomet Holdings', 'Edwards Lifesciences', 'Intuitive Surgical',
    'Align Technology', 'Dexcom Inc.', 'Insulet Corporation', 'Tandem Diabetes Care', 'ResMed Inc.',
    'Varian Medical Systems', 'Hologic Inc.', 'Cooper Companies', 'STERIS plc', 'Teleflex Incorporated',
    'CONMED Corporation', 'NuVasive Inc.', 'Globus Medical Inc.', 'SeaSpine Holdings', 'Alphatec Holdings',
    'RTI Surgical Holdings', 'Amedisys Inc.', 'Chemed Corporation', 'Addus HomeCare', 'LHC Group Inc.',
    'Encompass Health', 'Select Medical Holdings', 'Kindred Healthcare', 'Genesis Healthcare', 'The Ensign Group',
    'Sunrise Senior Living', 'Brookdale Senior Living', 'Five Star Senior Living', 'Capital Senior Living', 'Diversicare Healthcare',
    'Theravance Biopharma', 'Arena Pharmaceuticals', 'Sarepta Therapeutics', 'Bluebird Bio Inc.', 'Spark Therapeutics',
    'uniQure N.V.', 'Sangamo Therapeutics', 'CRISPR Therapeutics', 'Editas Medicine', 'Intellia Therapeutics',
    'Beam Therapeutics', 'Prime Medicine Inc.', 'Caribou Biosciences', 'Allogene Therapeutics', 'Fate Therapeutics',
    'Blueprint Medicines', 'Agios Pharmaceuticals', 'Deciphera Pharmaceuticals', 'Turning Point Therapeutics', 'Relay Therapeutics',
    'Revolution Medicines', 'Foghorn Therapeutics', 'C4 Therapeutics', 'Kymera Therapeutics', 'Arvinas Inc.',
    'Nurix Therapeutics', 'Monte Rosa Therapeutics', 'Cedilla Therapeutics', 'Dialectic Therapeutics', 'Faze Medicines',
    'Vividion Therapeutics', 'VantAI', 'Cullgen Inc.', 'Oncologie Inc.', 'Zentalis Pharmaceuticals',
    'PMV Pharmaceuticals', 'Erasca Inc.', 'Tango Therapeutics', 'Boundless Bio Inc.', 'Treadwell Therapeutics',
    'Tavros Therapeutics', 'Tango Therapeutics', 'Boundless Bio Inc.', 'Treadwell Therapeutics', 'Tavros Therapeutics',
    'Tango Therapeutics', 'Boundless Bio Inc.', 'Treadwell Therapeutics', 'Tavros Therapeutics', 'Tango Therapeutics',
    'Boundless Bio Inc.', 'Treadwell Therapeutics', 'Tavros Therapeutics', 'Tango Therapeutics', 'Boundless Bio Inc.',
    'Treadwell Therapeutics', 'Tavros Therapeutics', 'Tango Therapeutics', 'Boundless Bio Inc.', 'Treadwell Therapeutics',
]

energy_companies = [
    'ExxonMobil Corporation', 'Chevron Corporation', 'ConocoPhillips', 'Marathon Petroleum', 'Valero Energy',
    'Phillips 66', 'Kinder Morgan Inc.', 'Enterprise Products Partners', 'Williams Companies', 'ONEOK Inc.',
    'Energy Transfer LP', 'Plains All American Pipeline', 'MPLX LP', 'DCP Midstream Partners', 'Targa Resources',
    'Western Midstream Partners', 'Antero Midstream', 'EQT Corporation', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
    'Cabot Oil & Gas', 'Cimarex Energy', 'Diamondback Energy', 'Pioneer Natural Resources', 'EOG Resources',
    'Devon Energy', 'Continental Resources', 'Apache Corporation', 'Occidental Petroleum', 'Hess Corporation',
    'Noble Energy', 'Anadarko Petroleum', 'Chesapeake Energy', 'Range Resources', 'Southwestern Energy',
]

retail_companies = [
    'Walmart Inc.', 'Amazon.com Inc.', 'Costco Wholesale', 'Target Corporation', 'The Home Depot',
    'Lowe\'s Companies', 'TJX Companies', 'Kroger Company', 'Walgreens Boots Alliance', 'CVS Health',
    'Dollar General', 'Dollar Tree Inc.', 'Ross Stores', 'Burlington Stores', 'Nordstrom Inc.',
    'Macy\'s Inc.', 'Kohl\'s Corporation', 'Gap Inc.', 'L Brands', 'Abercrombie & Fitch',
    'American Eagle Outfitters', 'Urban Outfitters', 'Express Inc.', 'Guess Inc.', 'Levi Strauss & Co.',
    'Ralph Lauren Corporation', 'PVH Corp.', 'VF Corporation', 'Hanesbrands Inc.', 'Under Armour',
    'Nike Inc.', 'Adidas AG', 'Puma SE', 'Lululemon Athletica', 'Columbia Sportswear',
    'Deckers Outdoor', 'Skechers USA', 'Crocs Inc.', 'Wolverine World Wide', 'Steven Madden',
    'Caleres Inc.', 'DSW Inc.', 'Foot Locker', 'Finish Line', 'Hibbett Sports',
    'Academy Sports', 'Dick\'s Sporting Goods', 'Big 5 Sporting Goods', 'Sports Authority', 'Modell\'s Sporting Goods',
    'REI Co-op', 'Bass Pro Shops', 'Cabela\'s', 'Gander Outdoors', 'Camping World',
    'AutoZone Inc.', 'O\'Reilly Automotive', 'Advance Auto Parts', 'Genuine Parts Company', 'CarMax Inc.',
    'Carvana Co.', 'Vroom Inc.', 'Lithia Motors', 'Group 1 Automotive', 'Penske Automotive',
    'Asbury Automotive', 'Sonic Automotive', 'AutoNation Inc.', 'Hertz Global Holdings', 'Avis Budget Group',
    'Enterprise Holdings', 'Budget Rent a Car', 'Alamo Rent a Car', 'National Car Rental', 'Thrifty Car Rental',
    'Dollar Rent a Car', 'Sixt SE', 'Europcar', 'Hertz Corporation', 'Avis Budget Group',
    'Enterprise Holdings', 'Budget Rent a Car', 'Alamo Rent a Car', 'National Car Rental', 'Thrifty Car Rental',
    'Dollar Rent a Car', 'Sixt SE', 'Europcar', 'Hertz Corporation', 'Avis Budget Group',
    'Enterprise Holdings', 'Budget Rent a Car', 'Alamo Rent a Car', 'National Car Rental', 'Thrifty Car Rental',
    'Dollar Rent a Car', 'Sixt SE', 'Europcar', 'Hertz Corporation', 'Avis Budget Group',
    'Enterprise Holdings', 'Budget Rent a Car', 'Alamo Rent a Car', 'National Car Rental', 'Thrifty Car Rental',
]

# Combine all companies
all_companies = tech_companies + finance_companies + healthcare_companies + energy_companies + retail_companies

# Add more companies to reach 500
additional_companies = [
    'Starbucks Corporation', 'McDonald\'s Corporation', 'Yum! Brands', 'Chipotle Mexican Grill', 'Domino\'s Pizza',
    'Papa John\'s International', 'Pizza Hut', 'KFC Corporation', 'Taco Bell Corporation', 'Burger King',
    'Wendy\'s Company', 'Subway', 'Dunkin\' Brands', 'Tim Hortons', 'Dairy Queen',
    'Arby\'s', 'Jack in the Box', 'Carl\'s Jr.', 'Hardee\'s', 'White Castle',
    'In-N-Out Burger', 'Five Guys', 'Shake Shack', 'Culver\'s', 'Whataburger',
    'Raising Cane\'s', 'Chick-fil-A', 'Popeyes Louisiana Kitchen', 'Church\'s Chicken', 'Bojangles',
    'Zaxby\'s', 'Wingstop', 'Buffalo Wild Wings', 'Hooters', 'TGI Friday\'s',
    'Applebee\'s', 'Chili\'s', 'Olive Garden', 'Red Lobster', 'Outback Steakhouse',
    'Texas Roadhouse', 'LongHorn Steakhouse', 'Ruth\'s Chris Steak House', 'Morton\'s The Steakhouse', 'Fleming\'s Prime Steakhouse',
    'Capital Grille', 'Ruth\'s Chris Steak House', 'Morton\'s The Steakhouse', 'Fleming\'s Prime Steakhouse', 'Capital Grille',
    'Ruth\'s Chris Steak House', 'Morton\'s The Steakhouse', 'Fleming\'s Prime Steakhouse', 'Capital Grille', 'Ruth\'s Chris Steak House',
]

all_companies.extend(additional_companies)

# Ensure we have exactly 500 companies
all_companies = all_companies[:500]

# Generate descriptions based on industry
industry_descriptions = {
    'Technology': 'A leading technology company focused on innovation and digital transformation.',
    'Finance': 'A major financial services company providing banking, investment, and insurance solutions.',
    'Healthcare': 'A healthcare company developing medicines, medical devices, or providing healthcare services.',
    'Energy': 'An energy company involved in oil, gas, or renewable energy production and distribution.',
    'Retail': 'A retail company operating stores or e-commerce platforms for consumer goods.',
}

# Generate nodes
nodes = []
for i, company_name in enumerate(all_companies):
    node_id = f"c_{i}"
    
    # Determine industry
    if company_name in tech_companies:
        industry = 'Technology'
    elif company_name in finance_companies:
        industry = 'Finance'
    elif company_name in healthcare_companies:
        industry = 'Healthcare'
    elif company_name in energy_companies:
        industry = 'Energy'
    elif company_name in retail_companies:
        industry = 'Retail'
    else:
        industry = 'Retail'  # Default
    
    is_crypto = random.random() > 0.9  # 10% chance
    
    # Generate realistic price based on industry
    if industry == 'Technology':
        base_price = random.uniform(50, 500)
    elif industry == 'Finance':
        base_price = random.uniform(30, 200)
    elif industry == 'Healthcare':
        base_price = random.uniform(40, 400)
    elif industry == 'Energy':
        base_price = random.uniform(20, 150)
    else:
        base_price = random.uniform(25, 300)
    
    description = f"{industry_descriptions.get(industry, 'A leading company in its industry.')} {company_name} is a well-established organization."
    
    nodes.append({
        'id': node_id,
        'name': company_name,
        'type': 'company',
        'val': random.uniform(5, 25),
        'description': description,
        'price': round(base_price, 2),
        'change': round(random.uniform(-10, 10), 2),
        'tvl': round(random.uniform(100000000, 5000000000), 2) if is_crypto else None,
        'volume': round(random.uniform(1000000, 10000000), 2)
    })

# Generate links (relationships)
links = []
for i in range(len(nodes)):
    source = nodes[i]['id']
    num_links = random.randint(1, 4)
    
    for _ in range(num_links):
        target_idx = random.randint(0, len(nodes) - 1)
        if target_idx != i:
            link_type = random.choice(['partnership', 'ownership', 'investment'])
            links.append({
                'source': source,
                'target': nodes[target_idx]['id'],
                'type': link_type
            })

# Create final data structure
data = {
    'nodes': nodes,
    'links': links
}

# Write to JSON file
with open('src/data/companies.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f'Generated JSON file with {len(nodes)} companies and {len(links)} relationships')
