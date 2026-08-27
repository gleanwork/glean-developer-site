response.status_code   # int
response.headers       # dict[str, str]
response.url           # str
response.json_dict()   # dict — raises TypeError if the body was a list
response.json_list()   # list — raises TypeError if the body was an object
