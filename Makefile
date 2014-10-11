all: publish

publish:
	rm -rf /tmp/soongbu-highway
	git clone https://github.com/GDG-SSU/soongbu-highway.git /tmp/soongbu-highway
	cd /tmp/soongbu-highway; \
		git checkout gh-pages || git checkout -b gh-pages; \
		git rebase master; \
		git push -f origin gh-pages
	rm -rf /tmp/soongbu-highway
