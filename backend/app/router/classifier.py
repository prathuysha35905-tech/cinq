from app.router.rules import AGENT_KEYWORDS


class RuleClassifier:

    def classify(self, query: str) -> dict:
        query_lower = query.lower()

        scores = {
            agent: 0
            for agent in AGENT_KEYWORDS
        }

        matched_keywords = {
            agent: []
            for agent in AGENT_KEYWORDS
        }

        for agent, keywords in AGENT_KEYWORDS.items():

            for keyword in keywords:

                if keyword in query_lower:
                    scores[agent] += 1
                    matched_keywords[agent].append(keyword)

        best_agent = max(
            scores,
            key=scores.get
        )

        highest_score = scores[best_agent]

        total_score = sum(scores.values())

        if total_score == 0:
            confidence = 0.0
        else:
            confidence = highest_score / total_score

        return {
            "agent": best_agent,
            "confidence": round(confidence, 3),
            "scores": scores,
            "matched_keywords": matched_keywords,
        }