working_folder=$(pwd | sed -e "s|\/|\\\/|g")
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
    "umbrel")
      user="umbrel"
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
| sed -e "s/\$USER/$user/" \
| tee /etc/systemd/system/ring-of-fire-sharing.service >/dev/null

systemctl daemon-reload
systemctl start ring-of-fire-sharing.service
systemctl enable ring-of-fire-sharing.service