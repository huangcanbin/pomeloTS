# !/usr/bin/env python
# -*- coding:utf-8 -*-
import csv


def read(file_location):
    try:
        with open(file_location, 'r+') as csv_file:
            reader = csv.reader(csv_file)
            return [row for row in reader]
    except Exception, e:
        print "file not exist"


def read_dict(file_location):
    with open(file_location, 'r+') as csv_file:
        reader = csv.DictReader(csv_file)
        return [raw for raw in reader]


def write_dict(file_location, dictionaries, write_hr=False):
    with open(file_location, 'wb') as csv_file:
        headers = [k for k in dictionaries[0]]
        writer = csv.DictWriter(csv_file, fieldnames=headers)
        if write_hr:
            writer.writeheader()
        for item in dictionaries:
            writer.writerow(item)