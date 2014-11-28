# PATH should only include /usr/* if it runs after the mountnfs.sh script
PATH=/sbin:/usr/sbin:/bin:/usr/bin
APPNAME=torchki
PUSER="torchki"
DESC="$APPNAME service"
DAEMON=/usr/bin/node
WORK_DIR=/var/$APPNAME
CONFIG="/etc/$APPNAME"
DAEMON_ARGS="$WORK_DIR/bin/app.js --config=$CONFIG"
PIDFILE=/var/run/$APPNAME.pid
STDOUT=/var/log/$APPNAME/out.log
STDERR=/var/log/$APPNAME/err.log
NODE_PATH=/usr/lib/node_modules

# Function that starts the daemon/service
#
do_start()
{
        echo -n "Starting $APPNAME... "

        has_process && error "service exists, exiting : $DAEMON_ARGS"

        sudo -u $PUSER env NODE_PATH=$NODE_PATH $DAEMON $DAEMON_ARGS 2>> $STDERR >> $STDOUT &
        retval=$?

        [ $retval -ne 0 ] && error "unable start daemon"

        sleep 5

        CHPID=$(echo `ps aux | grep "$DAEMON_ARGS" | grep -v -P "grep|root" | awk '{print $2}'`)

        [[ -z $CHPID ]] && error "no process found"

        echo $CHPID > $PIDFILE

        echo "ok, pid: $CHPID"

        return $retval
}

# Function that stops the daemon/service
#
do_stop()
{
    echo "Stopping $APPNAME..."

    ! has_process && exit 0

    kill `cat $PIDFILE`
    retval=$?

    [ $retval -eq 0 ] && rm -f $PIDFILE

    echo "ok"
    return "$retval"
}

has_process() {

   S_P=`ps aux | grep "$DAEMON_ARGS" | grep -v -P "grep|root" | awk '{print $2}'`

   [[ -z $S_P ]] && return 1

   return 0
}

function error {
    echo "$1 Error !" 1>&2
    exit 1
}

[ -x "$DAEMON" ] || error "Not found or not executed $DAEMON"

# Make sure only root can run our script
[ `whoami` == root ] || error "This script must be run as root"

case "$1" in
  start)
        do_start
        ;;
  stop)
        do_stop
        ;;
  restart|force-reload)
        echo "Restarting $DESC" "$APPNAME"
        do_stop
        case "$?" in
          0|1)
                do_start
                ;;
          *)
                ;;
        esac
        ;;
  *)
        echo "Usage: $0 {start|stop|restart}" >&2
        exit 3
        ;;
esac