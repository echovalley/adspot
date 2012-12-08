#!/bin/bash

src_log_file=/usr/local/nginx/logs/kb.access.log
dest_log_dir=/var/log/adspot

if [ ! -f $src_log_file ]; then
  echo "Purge aborted!"
  echo "No such file - $src_log_file"
  exit
fi

current_hour_path=`date +%Y%m/%d`
current_hour_file=`date +%H.log`
#current_log_hour=`date +%Y%m%d%H` #such as 2012092018

latest_log_path=$dest_log_dir/raw/$current_hour_path
latest_log_file=$latest_log_path/$current_hour_file
latest_zip_file=$latest_log_file.gz

[ -d $latest_log_path ] || mkdir -p $latest_log_path

if [ -f $latest_zip_file ]; then
  tmp_file=$latest_log_path/part.tmp
  gzip -d $latest_zip_file
  mv $src_log_file $tmp_file && cat $latest_log_path/part.tmp >> $latest_log_file && rm $tmp_file
else
  mv $src_log_file $latest_log_file
fi


########basic##########

basic_log_path=$dest_log_dir/basic/$current_hour_path
basic_log_file=$dest_log_dir/basic/$current_hour_path/$current_hour_file
basic_zip_file=$basic_log_file.gz

[ -d $basic_log_path ] || mkdir -p $basic_log_path
[ -f $basic_zip_file ] && rm $basic_zip_file

cat $latest_log_file|grep 'pixel.php'|awk '{printf "%s\n", $7}' > $basic_log_file
#cat $latest_log_file|grep 'pixel.php'|awk '{print($7)}' | sort -nr | uniq -c > $basic_log_file

gzip $basic_log_file

########end of basic##########


gzip $latest_log_file

#nginx
kill -USR1 `cat /usr/local/nginx/logs/nginx.pid`
#apache
#kill -USR1 `cat /var/run/httpd.pid`

echo "`date +"[%Y-%m-%d %H:%M:%S]"` $latest_log_file" >> operation.log

#Remove logs 30 days ago
#date_for_remove=`date -d "30 days ago" +%Y%m%d%H`
old_log_file=$dest_log_path/raw/`date -v -30d +%Y%m/%d/%H`.log.gz
rm $old_log_file 2>/dev/null


########rake report############
#cd /Users/tony/projects/dstadmin && rake adspot:statistics[$current_log_hour]

