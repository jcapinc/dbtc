
function update_dbtc {
	cd $1;
	git pull;
	npm run build;
	systemctl restart $1
	cd ..
}

update_dbtc "dbtc"
update_dbtc "dbtc1"
update_dbtc "dbtc2"
update_dbtc "dbtc3"
update_dbtc "dbtc4"
update_dbtc "dbtc5"
