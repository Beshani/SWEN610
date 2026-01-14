import hashlib

def hash_given_entity(root: int, num_char : int = -1) -> str:
    gen_hash = hashlib.sha256(str(root).encode()).hexdigest()
    if num_char is None or num_char < 0:
        return gen_hash
    return gen_hash[:num_char]