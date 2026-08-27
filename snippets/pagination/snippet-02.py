super().__init__(
    base_url="https://api.example.com/v2",
    path="/articles",
    pagination="offset",
    page_size=100,        # required, must be > 0
    offset_param="offset",
    limit_param="limit",
    start_offset=0,
)
