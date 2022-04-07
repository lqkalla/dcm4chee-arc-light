Running dcm4chee-arc-ui2 locally




Development setup for dcm4chee-arc-ui2 

Follow the instructions from: https://github.com/dcm4che/dcm4chee-arc-light/wiki/Installation

- Install Java(12.0.1 works), Wildfly(), PostgreSQL()

- 

Delete crossOrigin and allowedCommonJsDependencies under serve in angular.json

npm uninstall -g @angular/cli
npm cache clean
npm install -g @angular/cli@1.4.1

npm install yarn -g

yarn install

docker run -d \
--name dcm-arc-db \
--restart always \
-p 5442:5432 \
-e POSTGRES_PASSWORD=postgres \
-e PGDATA=/var/lib/postgresql/data/pgdata \
-v /Users/juri/dcm-arc-db:/var/lib/postgresql/data \
postgres:14

docker run --name ldap \
-p 8389:389 \
--restart always \
-e STORAGE_DIR=/Users/juri/dcm-arc-db/storage/fs1 \
-v /Users/juri/dcm-arc-db/ldap-data/ldap:/var/lib/openldap/openldap-data \
-v /Users/juri/dcm-arc-db/ldap-data/slapd.d:/etc/openldap/slapd.d \
-d dcm4che/slapd-dcm4chee:2.6.0-26.0

/subsystem=datasources/jdbc-driver=postgres:add(driver-name="postgres",driver-module-name="org.postgresql",driver-class-name=org.postgresql.Driver)

data-source add --name=PacsDS \
     --driver-name=postgres \
     --connection-url=jdbc:postgresql://localhost:5442/dcm \
     --jndi-name=java:/PacsDS \
     --user-name=postgres \
     --password=postgres
     
mvn install -DskipTests

KEYSTORE_TYPE=PKCS12;KEYSTORE=/Users/juri/workspace/wildfly-24.0.1.Final/standalone/configuration/keystores/key.p12;KEYSTORE_PASSWORD=secret;EXTRA_CACERTS=KEYSTORE\=/Users/juri/workspace/wildfly-24.0.1.Final/standalone/configuration/keystores/cacerts.p12;KEY_PASSWORD=secret;TRUSTSTORE_TYPE=PKCS12;TRUSTSTORE_PASSWORD=changeit;EXTRA_CACERTS_PASSWORD=secret;TRUSTSTORE=/Library/Java/JavaVirtualMachines/adoptopenjdk-14.jdk/Contents/Home/lib/security/cacerts;STORAGE_DIR=/Users/juri/dcm-arc-db/storage

docker run --rm  dcm4che/dcm4che-tools storescu -cDCM4CHEE@host.docker.internal:11112 /opt/dcm4che/etc/testdata/dicom

ng serve --base-href /dcm4chee-arc/ui2/ --proxy-config proxy-conf.json








Old

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