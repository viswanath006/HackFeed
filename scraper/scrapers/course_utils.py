"""
scraper/scrapers/course_utils.py

Shared utilities for course normalization, domain categorization,
and level inference for HackFeed courses.
"""

from typing import Optional, List, Any
import re

CONTROLLED_DOMAINS = [
    "Web Development",
    "AI/ML",
    "Cloud Computing",
    "DSA",
    "Cybersecurity",
    "Data Science",
]

# Keywords mapped to controlled domains (ordered by specificity)
DOMAIN_KEYWORD_MAP = {
    "Cybersecurity": [
        "cybersecurity", "cyber security", "information security", "ethical hacking",
        "network security", "cryptography", "penetration testing", "pen testing",
        "malware", "infosec", "soc analyst", "computer security", "vulnerability assessment",
        "defensive security", "incident response", "digital forensics"
    ],
    "AI/ML": [
        "machine learning", "artificial intelligence", "deep learning", "neural network",
        "natural language processing", "nlp", "llm", "large language model",
        "computer vision", "generative ai", "reinforcement learning", "tensorflow",
        "pytorch", "hugging face", "transformers", "data mining", "ai foundations"
    ],
    "Cloud Computing": [
        "cloud computing", "cloud architect", "aws", "amazon web services", "azure",
        "google cloud", "gcp", "devops", "kubernetes", "docker", "serverless",
        "terraform", "microservices", "ci/cd", "cloud security", "distributed systems"
    ],
    "DSA": [
        "data structures", "algorithms", "dsa", "dynamic programming",
        "graph algorithms", "competitive programming", "problem solving",
        "sorting and searching", "data structure", "algorithm",
        "object oriented programming in c++", "java programming and data structures"
    ],
    "Web Development": [
        "web development", "full stack", "fullstack", "front-end", "frontend",
        "back-end", "backend", "html", "css", "javascript", "react", "next.js",
        "node.js", "express.js", "vue", "angular", "responsive web", "rest api",
        "restful api", "django", "flask", "web design", "c#", "asp.net", "php"
    ],
    "Data Science": [
        "data science", "data analysis", "data analytics", "data visualization",
        "pandas", "numpy", "matplotlib", "tableau", "power bi", "sql", "postgresql",
        "relational database", "data engineering", "big data", "apache spark",
        "scientific computing", "business intelligence", "statistics for data"
    ],
}

# Coursera specific subdomainId / domainId mapping
COURSERA_SUBDOMAIN_MAP = {
    "machine-learning": "AI/ML",
    "artificial-intelligence": "AI/ML",
    "deep-learning": "AI/ML",
    "cloud-computing": "Cloud Computing",
    "computer-security-and-networks": "Cybersecurity",
    "algorithms": "DSA",
    "software-development": "Web Development",
    "web-development": "Web Development",
    "mobile-development": "Web Development",
    "data-analysis": "Data Science",
    "data-management": "Data Science",
    "probability-and-statistics": "Data Science",
}


def map_domain(
    title: str,
    description: str = "",
    tags: Optional[List[str]] = None,
    domain_types: Optional[Any] = None
) -> Optional[str]:
    """
    Maps course metadata to one of the 6 controlled domains:
    'Web Development', 'AI/ML', 'Cloud Computing', 'DSA', 'Cybersecurity', 'Data Science'.
    Returns None if no confident match is found.
    """
    # 1. Check Coursera domainTypes structure if supplied
    if domain_types and isinstance(domain_types, list):
        for dt in domain_types:
            if isinstance(dt, dict):
                subdomain = dt.get("subdomainId", "").lower()
                if subdomain in COURSERA_SUBDOMAIN_MAP:
                    return COURSERA_SUBDOMAIN_MAP[subdomain]
                domain_id = dt.get("domainId", "").lower()
                if domain_id == "data-science":
                    return "Data Science"

    # 2. Text keyword matching
    text_content = f"{title} {description}".lower()
    if tags:
        text_content += " " + " ".join(t.lower() for t in tags)

    # Score matches by keyword hits
    scores = {d: 0 for d in CONTROLLED_DOMAINS}
    for domain, keywords in DOMAIN_KEYWORD_MAP.items():
        for kw in keywords:
            # Word boundary search
            pattern = r"\b" + re.escape(kw) + r"\b"
            matches = len(re.findall(pattern, text_content))
            if matches > 0:
                # Title matches get 3x weight
                title_matches = len(re.findall(pattern, title.lower()))
                scores[domain] += matches + (title_matches * 3)

    best_domain = max(scores, key=scores.get)
    if scores[best_domain] > 0:
        return best_domain

    return None


def infer_level(title: str, description: str = "") -> Optional[str]:
    """
    Infers course level ('beginner', 'intermediate', 'advanced')
    from course title and description.
    """
    text = f"{title} {description}".lower()

    # Explicit mentions
    if any(w in text for w in ["advanced", "expert", "deep dive", "specialist", "masterclass", "complex"]):
        return "advanced"
    if any(w in text for w in ["intermediate", "medium", "practitioner", "applied"]):
        return "intermediate"
    if any(w in text for w in ["beginner", "introductory", "introduction", "basics", "fundamentals", "foundations", "getting started", "101", "zero to hero"]):
        return "beginner"

    return "beginner"


def parse_rating(rating_val: Any) -> Optional[float]:
    """Parses and bounds rating to 0.0 - 5.0 with 1 decimal place."""
    if rating_val is None:
        return None
    try:
        val = float(rating_val)
        if 0.0 <= val <= 5.0:
            return round(val, 1)
        if 5.0 < val <= 10.0:  # out of 10
            return round(val / 2.0, 1)
        if 10.0 < val <= 100.0: # percentage
            return round((val / 100.0) * 5.0, 1)
    except (ValueError, TypeError):
        pass
    return None
