server {
	listen			80;

	server_name		sandbox.oxsar3.ru;

	root	/home/os/oxsar3.ru/www;

	error_log		/var/log/nginx/error.oxsar3_ru.log;
	# access_log		/var/log/nginx/access.oxsar3_ru.log;
	access_log		off;
	
	rewrite ^(.+\.html)/$	$1 permanent;

	location ~ /\.ht {
		deny all;
	}

	location ~ /\.git {
		deny all;
	}

	if ($request_uri ~* "^[\w\-\/]+[^\/?]$") {
		rewrite ^(.*)$ $scheme://$host$1/ permanent;
	}

	location / {
		try_files $uri $uri/ /index.osh?$args;
	}

	location ~* \.(jpg|jpeg|png|gif|swf|flv|mp4|mov|avi|wmv|m4v|mkv|ico|js|css|txt)$ {
		access_log off;
		expires 7d;
	}

	charset	utf-8;

	location ~ ^.+\.(osh?|html?) {
		fastcgi_split_path_info	^(.+?\.osh?)(.*)$;
		fastcgi_pass	127.0.0.1:9000;
		fastcgi_index	index.osh;
		include fastcgi_params;
		fastcgi_intercept_errors	on;
		fastcgi_ignore_client_abort	on;
		fastcgi_read_timeout	360;
	}
}
