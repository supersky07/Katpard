#!/bin/bash
while [[ -z $NODEDIR ]]; do
    read -p "where is your node installed:" NODEDIR
done

while [[ -z $MONGO ]]; do
    echo 'tell me your mongoDB for restoring the monitoring data:'
    echo 'example: mongodb://testrw:1234567@10.13.49.237:27017/ForTest'
    read -a MONGO
done

echo '/*************************************************************/'
echo '        your node path:'
echo "                    ${NODEDIR}"
echo '        your mongo address:'
echo "                    ${MONGO}"
echo '/*************************************************************/'
while [[ -z $confirm ]]; do
    read -p "confirm?[y/N]" confirm
    if [[ $confirm = 'y' ]] || [[ $confirm = 'Y' ]]; then
        break
    elif [[ $confirm = 'n' ]] || [[ $confirm = 'N' ]]; then
        echo bye!
        exit
    else
        confirm=''
    fi
done

root=$(pwd | sed "s;\/;\\\/;g")
NODEDIR=$(echo $NODEDIR | sed "s;\/;\\\/;g")
MONGO=$(echo $MONGO | sed "s;\/;\\\/;g")

sed -i "s;\/data1\/pageMonitor;${root};g" automation/monitors/core.js
sed -i "s;\/data1\/pageMonitor;${root};g" node/cron/disk_clean/clean.sh
sed -i "s;\/data1\/pageMonitor;${root};g" node/cron/monitor/ria_monitor.js
sed -i "s;\/data1\/pageMonitor;${root};g" node/modules/ria/controller.js
sed -i "s;\/data1\/pageMonitor;${root};g" node/cron/check_daemon/cron.sh
sed -i "s;\/data1\/pageMonitor;${root};g" cron
sed -i "s;^ *casperjs.*;    casperjs: '${root}/automation/bin/casperjs',;g" node/config/all.js
sed -i "s;^ *node.*;    node: '${NODEDIR}';g" node/config/all.js
sed -i "s;^ *'default_exec'.*;        'default_exec' : '${root}/automation/bin/phantomjs';" automation/bin/casperjs
sed -i "s;^ *pagemonitor.*;            pagemonitor: '${MONGO}',;g" node/config/env/production.js
chmod +x automation/bin/casperjs
chmod +x automation/bin/phantomjs
chmod +x restart.sh
chmod +x node/cron/check_daemon/cron.sh
chmod +x node/cron/disk_clean/clean.sh
mkdir har
mkdir log
mkdir err

echo "enjoy!"