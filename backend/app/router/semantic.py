from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class SemanticRouter:

    def __init__(self, registry):

        self.registry = registry

        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

        self.agent_descriptions = {
            "code": """
            Programming and software engineering questions.
            Writing, debugging, or explaining source code.
            Python, Java, JavaScript, TypeScript, C++, APIs, FastAPI,
            Django, Flask, React, Next.js, databases, SQL, algorithms,
            data structures, programming errors, exceptions, stack traces,
            HTTP errors, API errors, software architecture and development.
            """,

            "writer": """
            Writing and language tasks.
            Create stories, poems, essays, articles, blog posts, scripts,
            captions, emails, letters, professional messages and other
            written content. Rewrite, edit, paraphrase, improve grammar,
            summarize or transform existing text.
            """,

            "math": """
            Mathematical and numerical problems.
            Arithmetic, equations, algebra, calculus, derivatives,
            integrals, probability, statistics, geometry, matrices,
            percentages, numerical calculations and mathematical proofs.
            Solve mathematical problems and show calculation steps.
            """,

            "research": """
            Research and factual information requests.
            Current events, recent developments, news, historical facts,
            academic research, scientific information, technical research,
            comparisons based on facts, evidence, sources and real-world
            information. Questions asking what happened recently or what
            is currently known belong here.
            """,

            "chat": """
            General casual conversation and everyday assistance.
            Greetings, casual discussion, jokes, opinions, brainstorming,
            recommendations, entertainment and conversational questions
            that do not specifically require programming, mathematics,
            writing or research.
            """
        }

        self.agent_ids = list(
            self.agent_descriptions.keys()
        )

        self.agent_embeddings = self.model.encode(
            list(self.agent_descriptions.values()),
            normalize_embeddings=True
        )

    def route(self, query: str):

        query_embedding = self.model.encode(
            [query],
            normalize_embeddings=True
        )

        similarities = cosine_similarity(
            query_embedding,
            self.agent_embeddings
        )[0]

        scores = {
            agent_id: round(
                float(score),
                4
            )
            for agent_id, score in zip(
                self.agent_ids,
                similarities
            )
        }

        best_agent_id = max(
            scores,
            key=scores.get
        )

        confidence = scores[best_agent_id]

        agent = self.registry.get_agent(
            best_agent_id
        )

        return {
            "agent": agent,
            "agent_id": best_agent_id,
            "confidence": round(
                confidence,
                4
            ),
            "scores": scores,
        }