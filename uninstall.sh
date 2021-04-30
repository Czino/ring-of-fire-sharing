stop=false
config_file=""

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        echo "-c, --config       (optional) define config file to load"
        stop=true
        ;;
      "-c" | "--config")
        shift
        config_file="$1"
        ;;
    esac
    shift
  done
}

_setArgs $*

if "$stop"; then
  return
fi

if [ ! -n "$config_file" ]; then
  config_file=$(./getConfig.sh)
fi
if [[ "$config_file" == *"Error"* ]] || [ ! -n "$config_file" ] || [ ! -f "$config_file" ]; then
  echo "$config_file does not exists."
  return
fi

ring=$(echo "$config_file" | sed 's/rings\///' | sed 's/.json//')


systemctl stop "ring-of-fire-sharing-${ring}.service"
systemctl disable "ring-of-fire-sharing-${ring}.service"

rm "/etc/systemd/system/ring-of-fire-sharing-${ring}.service"
