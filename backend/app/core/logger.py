import logging


def setup_logger():

    logger = logging.getLogger("cinq")

    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler()

    formatter = logging.Formatter(
        "[%(asctime)s] "
        "[%(levelname)s] "
        "%(message)s"
    )

    handler.setFormatter(formatter)

    logger.addHandler(handler)

    return logger


logger = setup_logger()