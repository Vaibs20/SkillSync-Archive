import unittest

from model import SkillSyncModel


def user(
    user_id,
    name,
    email,
    known_skills=None,
    career_path=None,
    learning_goal="",
    passing_year=2026,
    availability="5 - 6 hours per week",
):
    return {
        "_id": user_id,
        "name": name,
        "email": email,
        "known_skills": known_skills or [],
        "career_path": career_path or [],
        "learning_goal": learning_goal,
        "passing_year": passing_year,
        "availability": availability,
    }


class SkillSyncModelSearchTests(unittest.TestCase):
    def setUp(self):
        self.model = SkillSyncModel()

    def test_exact_email_outranks_high_similarity_profile(self):
        users = [
            user("exact", "Alice Kumar", "alice@example.com", ["Figma"], ["Design"]),
            user(
                "similar",
                "Bob Singh",
                "bob@example.com",
                ["Python", "Machine Learning"],
                ["AI & Machine Learning"],
                "Python AI",
                2028,
                "17 - 18 hours per week",
            ),
        ]

        results = self.model.search("python machine learning", users, {"email": "ALICE@example.com"})

        self.assertEqual(results[0]["_id"], "exact")

    def test_exact_name_outranks_high_similarity_profile(self):
        users = [
            user("exact", "Alice Kumar", "alice@example.com", ["Figma"], ["Design"]),
            user(
                "similar",
                "Bob Singh",
                "bob@example.com",
                ["Python", "Machine Learning"],
                ["AI & Machine Learning"],
                "Python AI",
                2028,
                "17 - 18 hours per week",
            ),
        ]

        results = self.model.search("python machine learning", users, {"name": "Alice Kumar"})

        self.assertEqual(results[0]["_id"], "exact")

    def test_name_match_is_case_and_spacing_insensitive(self):
        users = [
            user("exact", "  ALICE   Kumar  ", "alice@example.com"),
            user("other", "Alice Verma", "alice.verma@example.com"),
        ]

        results = self.model.search("", users, {"name": "alice kumar"})

        self.assertEqual([result["_id"] for result in results], ["exact"])

    def test_same_name_users_with_different_emails_are_not_collapsed(self):
        users = [
            user("first", "Jordan Lee", "jordan.one@example.com"),
            user("second", "Jordan Lee", "jordan.two@example.com"),
            user("other", "Jordan Ray", "jordan.ray@example.com"),
        ]

        results = self.model.search("", users, {"name": "Jordan Lee"})

        self.assertEqual({result["_id"] for result in results}, {"first", "second"})

    def test_name_substring_search_returns_partial_matches_after_exact_matches(self):
        users = [
            user("exact", "Kum", "kum@example.com"),
            user("first", "Alice Kumar", "alice@example.com"),
            user("second", "Ravi Kumar", "ravi@example.com"),
            user("other", "Jordan Lee", "jordan@example.com"),
        ]

        results = self.model.search("", users, {"name": "kum"})

        self.assertEqual(results[0]["_id"], "exact")
        self.assertEqual({result["_id"] for result in results}, {"exact", "first", "second"})

    def test_name_subphrase_search_matches_token_prefixes(self):
        users = [
            user("match", "Alice Kumar", "alice@example.com"),
            user("other", "Alice Verma", "alice.verma@example.com"),
        ]

        results = self.model.search("", users, {"name": "ali ku"})

        self.assertEqual([result["_id"] for result in results], ["match"])

    def test_name_search_handles_similar_phrase_typos(self):
        users = [
            user("match", "Alice Kumar", "alice@example.com"),
            user("other", "Jordan Lee", "jordan@example.com"),
        ]

        results = self.model.search("", users, {"name": "alce kumr"})

        self.assertEqual([result["_id"] for result in results], ["match"])

    def test_email_substring_search_returns_partial_matches(self):
        users = [
            user("first", "Alice Kumar", "alice.kumar@example.com"),
            user("second", "Alice Verma", "alice.verma@example.com"),
            user("other", "Jordan Lee", "jordan@example.com"),
        ]

        results = self.model.search("", users, {"email": "alice"})

        self.assertEqual({result["_id"] for result in results}, {"first", "second"})

    def test_skill_only_search_preserves_similarity_ranking(self):
        users = [
            user("design", "Design User", "design@example.com", ["Figma"], ["Design"]),
            user(
                "python",
                "Python User",
                "python@example.com",
                ["Python", "Machine Learning"],
                ["AI & Machine Learning"],
                "Python AI",
            ),
        ]

        results = self.model.search("python", users)

        self.assertEqual(results[0]["_id"], "python")

    def test_empty_search_returns_no_results(self):
        users = [user("one", "Alice Kumar", "alice@example.com")]

        self.assertEqual(self.model.search("", users), [])


if __name__ == "__main__":
    unittest.main()
