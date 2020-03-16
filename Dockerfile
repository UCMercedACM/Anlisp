FROM ubuntu:16.04
FROM node:10

# Add the PostgreSQL PGP key to verify their Debian packages.
# It should be the same key as https://www.postgresql.org/media/keys/ACCC4CF8.asc
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=DontWarn
RUN apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8

# Add PostgreSQL's repository. It contains the most recent stable release
#     of PostgreSQL, ``12.2``.
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ACCC4CF8.asc precise-pgdg main" > /etc/apt/sources.list.d/pgdg.list

# Install ``python-software-properties``, ``software-properties-common`` and PostgreSQL 12.2
#  There are some warnings (in red) that show up during the build. You can hide
#  them by prefixing each apt-get statement with DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y software-properties-common postgresql-12.2 postgresql-client-12.2 postgresql-contrib-12.2

# Note: The official Debian and Ubuntu images automatically ``apt-get clean``
# after each ``apt-get``

# Run the rest of the commands as the ``postgres`` user created by the ``postgres-12.2`` package when it was ``apt-get installed``
USER postgres

# Create a PostgreSQL role named ``docker`` with ``docker`` as the password and
# then create a database `docker` owned by the ``docker`` role.
# Note: here we use ``&&\`` to run commands one after the other - the ``\``
#       allows the RUN command to span multiple lines.
RUN    /etc/init.d/postgresql start &&\
    psql --command "CREATE USER docker WITH SUPERUSER PASSWORD 'docker';" &&\
    createdb -O docker members &&\
    psql --command "create table if not exists members (ID serial primary key not null, student_id varchar(15) not null, first_name varchar(255) not null, last_name varchar(255) not null, email varchar(255) not null, password varchar(255) not null, year varchar(30), github varchar(255), linkedin varchar(255), personal_website varchar(255), stack_overflow varchar(255), portfolium varchar(255), handshake varchar(255), slack varchar(50), discord varchar(50), thumbnail varchar(50), active boolean, banned boolean, privilege varchar(50), created_at TIMESTAMPTZ default NOW());"

# Adjust PostgreSQL configuration so that remote connections to the
# database are possible.
RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/12.2/main/pg_hba.conf

# And add ``listen_addresses`` to ``/etc/postgresql/12.2/main/postgresql.conf``
RUN echo "listen_addresses='*'" >> /etc/postgresql/12.2/main/postgresql.conf

# Expose the PostgreSQL port
EXPOSE 5432

# Add VOLUMEs to allow backup of config, logs and databases
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

# Set the default command to run when starting the container
CMD ["/usr/lib/postgresql/12.2/bin/postgres", "-D", "/var/lib/postgresql/12.2/main", "-c", "config_file=/etc/postgresql/12.2/main/postgresql.conf"]

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json /app/package.json
RUN npm install -g yarn
RUN yarn install

# Bundle app source
COPY . /app

EXPOSE 4201:4201
RUN yarn start
