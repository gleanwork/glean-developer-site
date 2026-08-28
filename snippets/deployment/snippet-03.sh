glean-idx deploy init --cloud gcp \
  --connector-name company-wiki \
  --connector-class CompanyWikiConnector \
  --connector-module connector \
  --connector-factory create_connector

cp .env.example .env
# Edit glean_deployment.yaml and fill in .env before continuing.

glean-idx datasource configure --connector connector:CompanyWikiConnector
glean-idx deploy build --push
glean-idx deploy secrets upload
glean-idx deploy apply
