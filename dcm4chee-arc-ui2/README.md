docker run -d \
--name dcm-arc-db \
--restart always \
-p 5442:5432 \
-e POSTGRES_PASSWORD=postgres \
-e PGDATA=/var/lib/postgresql/data/pgdata \
-v /Users/laurakallas/dcm-arc-db:/var/lib/postgresql/data \
postgres:14

docker run --name ldap \
-p 8389:389 \
--restart always \
-e STORAGE_DIR=/Users/laurakallas/dcm-arc-db/storage/fs1 \
-v /Users/laurakallas/dcm-arc-db/ldap-data/ldap:/var/lib/openldap/openldap-data \
-v /Users/laurakallas/dcm-arc-db/ldap-data/slapd.d:/etc/openldap/slapd.d \
-d dcm4che/slapd-dcm4chee:2.6.0-26.0