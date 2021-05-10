stop=false
config_file=""

_setArgs(){
  while [ "$1" != "" ]; do
    case $1 in
      "-h" | "--help")
        echo "options:"
        echo "-h, --help         show brief help"
        echo "-c, --config       (optional) define config file to load"
        echo "--from-port        (optional, default 4080) internal port for hidden service, important to have different ports if you run multiple services"
        echo "--to-port          (optional, default 4080) external port for hidden service, important to have different ports if you run multiple services"
        stop=true
        ;;
      "-c" | "--config")
        shift
        config_file="$1"
        ;;
      "--from-port")
        shift
        from_port="$1"
        ;;
      "--to-port")
        shift
        to_port="$1"
        ;;
    esac
    shift
  done
}

_setArgs $*

if "$stop"; then
  return
fi

PS3='Save or send data? Save = your peers call your hidden service // send = you send the data to another party you trust'
options=("save" "send")
select opt in "${options[@]}"
do
  case $opt in
    "save")
      script="saveRingStats"
      break
      ;;
    "send")
      script="sendRingStats"
      break
      ;;
    *) echo "invalid option $REPLY";;
  esac
done

if [[ "$script" == 'saveRingStats' ]]; then
  if [ ! -n "$from_port" ]; then
    read -p 'Map from incoming port: (default: 4080)' from_port
  fi
  if [ ! -n "$from_port" ]; then
    from_port=4080
  fi

  if [ ! -n "$to_port" ]; then
    read -p 'Map to port: (default: 4080)' to_port
  fi
  if [ ! -n "$to_port" ]; then
    to_port=4080
  fi


  if [ ! -n "$config_file" ]; then
    config_file=$(./getConfig.sh)
  fi
  if [[ "$config_file" == *"Error"* ]] || [ ! -n "$config_file" ] || [ ! -f "$config_file" ]; then
    echo "$config_file does not exists."
    return
  fi

  # Get general data
  ring=$(echo "$config_file" | sed 's/rings\///' | sed 's/.json//')
  user=$(echo "$config" | jq -r '.auth.user' | tr -d '"')
  password=$(echo "$config" | jq -r '.auth.password' | tr -d '"')
  working_folder=$(pwd)
  arguments=$(echo "-c $config_file" | sed -e "s|\/|\\\/|g")

  # install Tor hidden service
  apt-get install -y apache2-utils nginx

  # set user authentication based on config
  htpasswd -c -b /etc/apache2/."$ring"-htpasswd "$user" "$password"

  # TODO add rate limiting https://www.nginx.com/blog/rate-limiting-nginx/
  cat > "/etc/nginx/sites-enabled/rof_${ring}_service" <<EOF
server {
    listen       $to_port;
    server_name  RingOfFire-$ring;

    root   $working_folder/data/$ring;

    location / {
      auth_basic           "$ring";
      auth_basic_user_file /etc/apache2/.$ring-htppasswd;
    }
}
EOF

  if [ -e /var/run/nginx.pid ]; then
    # nginx is running
    sudo nginx -s reload

  else
    sudo nginx
  fi


  # install tor hidden service
  echo "HiddenServiceDir /var/lib/tor/rof_${ring}_service/" >> /etc/tor/torrc
  echo "HiddenServicePort $from_port 127.0.0.1:$to_port" >> /etc/tor/torrc

  # restart tor
  /etc/init.d/tor restart

  # Tell user the hidden service URL
  hidden_service_url=$(cat "/var/lib/tor/rof_${ring}_service/hostname")
  echo "Your tor hidden service url is: $hidden_service_url:$from_port"
fi

# install local systemd service for running 24/7
user=$(whoami)
working_folder=$(pwd | sed -e "s|\/|\\\/|g")

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
| sed -e "s/\$SCRIPT/$script/" \
| sed -e "s/\$ARGS/$arguments/" \
| sed -e "s/\$USER/$user/" \
| tee "/etc/systemd/system/ring-of-fire-sharing-${ring}.service" >/dev/null

systemctl daemon-reload
systemctl start "ring-of-fire-sharing-${ring}.service"
systemctl enable "ring-of-fire-sharing-${ring}.service"

