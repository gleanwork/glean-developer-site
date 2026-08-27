super().__init__(
    base_url="https://api.example.com/v2",
    path="/articles",
    pagination="cursor",
    cursor_param="cursor",       # request parameter name
    cursor_key="next_cursor",    # response body key
    page_size=100,
)
