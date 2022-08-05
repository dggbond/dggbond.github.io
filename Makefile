.PHONY: deploy
deploy:
	@hugo --baseURL https://tilemoon.life
	@echo "hugo build successed."
	@rsync -r public/* server:/var/www/blog/
	@echo "deploy successed."
	@git add .
