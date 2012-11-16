#!/bin/bash

last_log_hour=`date -v -1H +%Y%m%d%H` #such as 2012092018

cd /Users/tony/projects/dstadmin && rake adspot:statistics[$last_log_hour]
