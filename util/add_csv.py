#!/usr/bin/env python
"""
add-csv is used in forms for supervisors to add entire csv's to the db
THEY MUST follow the format
Load a set of application-dataset relationships in CSV form into a Neptune graph database
"""
import sys
sys.path.append("../")
import csv
import json
import re
from util.graph_db import GraphDB

def db_input_csv(fstring, orcid):
    graph = GraphDB()
    # initiate csv reader
    reader = [{k: v for k, v in row.items()} for row in csv.DictReader(fstring.splitlines(), skipinitialspace=True)]
    # loop through every line in csv file
    headers = reader[0].keys()
    print(headers)
    required_headers = {'topic', 'name', 'site', 'description', 'title', 'doi'}
    if not required_headers.issubset(headers):
        return False 
    for line in reader:
        if 'screenshot' not in line:
            line['screenshot'] = 'NA'
        if 'publication' not in line:
            line['publication'] = 'None'
        print(line)
        if not 'type' in line.keys():
            line['type'] = 'unclassified'
        line['topic'] = re.sub("\]|\[|\'", '', line['topic'])
        line['topic'] = line['topic'].split(',')
        line['type'] = re.sub("\]|\[|\'", '', line['type'])
        line['type'] = line['type'].split(',')
        for index, t in enumerate(line['topic']):
            line['topic'][index] = t.strip()
            print(graph.add_topic(line['topic'][index]))
        if {'app_discoverer', 'app_verified', 'app_verifier'}.issubset(headers):
            graph.add_app(line, discoverer=line['app_discoverer'], verified=('True'==line['app_verified']), verifier=line['app_verifier'])
        else: 
            graph.add_app(line, discoverer=orcid, verified=True, verifier=orcid)
            #graph.add_app(line)
        graph.add_dataset(line)
        if {'discoverer', 'verifier', 'verified'}.issubset(headers):
            print('new line:\n', line)
            print('verifier:\n', line['verified'])
            graph.add_relationship(line['site'], line['doi'], discoverer=line['discoverer'], verified='True'==line['verified'], verifier=line['verifier'], annotation=line['annotation'])
        else:
            graph.add_relationship(line['site'], line['doi'], discoverer=orcid, verified=True, verifier=orcid)

    # counts vertices, used for troubleshooting purposes
    print(graph.get_vertex_count())
    print(graph.get_edge_count())
    return True

