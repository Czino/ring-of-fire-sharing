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
working_folder=$(pwd | sed -e "s|\/|\\\/|g")
arguments=$(echo "-c $config_file" | sed -e "s|\/|\\\/|g")

user=$(whoami)

PS3='Lightning Implementation (type the corresponding number):'
options=("$user (current)" "lightning" "lnd" "umbrel" "other (specify)")
select opt in "${options[@]}"
do
  case $opt in
    "$user (current)")
      break
      ;;
    "lightning")
      user="lightning"
      break
      ;;
    "lnd")
      user="lnd"
      break
      ;;
    "other (specify)")
      read -p 'User for lightning: ' user
      break
      ;;
    "Quit")
      break
      ;;
    *) echo "invalid option $REPLY";;
  esac
done

cat ./ring-of-fire-sharing.service \
| sed -e "s/\$PWD/$working_folder/" \
| sed -e "s/\$ARGS/$arguments/" \
| sed -e "s/\$USER/$user/" \
| tee "/etc/systemd/system/ring-of-fire-sharing-${ring}.service" >/dev/null

systemctl daemon-reload
systemctl start "ring-of-fire-sharing-${ring}.service"
systemctl enable "ring-of-fire-sharing-${ring}.service"
