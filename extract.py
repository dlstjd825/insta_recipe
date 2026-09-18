import instaloader

L = instaloader.Instaloader()

def get_caption(url):
    shortcode = url.rstrip("/").split("/")[-1]

    post = instaloader.Post.from_shortcode(
        L.context,
        shortcode
    )
    return post.caption