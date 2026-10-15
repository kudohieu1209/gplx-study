import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from extract_questions import page_image_events


class PageImageEventsTests(unittest.TestCase):
    def test_reused_resource_is_attached_at_every_placement(self):
        shared = object()
        page = SimpleNamespace(images=[
            {"name": "Image198", "top": 308, "x0": 85},
            {"name": "Image198", "top": 523, "x0": 85},
        ])
        raw_page = SimpleNamespace(images={"/Image198": shared})

        events = page_image_events(page, raw_page)

        self.assertEqual([event["top"] for event in events], [308, 523])
        self.assertTrue(all(event["raw"] is shared for event in events))

    def test_resource_order_does_not_determine_question_image(self):
        first, second = object(), object()
        page = SimpleNamespace(images=[
            {"name": "Second", "top": 80},
            {"name": "First", "top": 300},
        ])
        raw_page = SimpleNamespace(images={"/First": first, "/Second": second})

        events = page_image_events(page, raw_page)

        self.assertEqual([event["raw"] for event in events], [second, first])

    def test_unknown_resource_fails_instead_of_silently_losing_image(self):
        page = SimpleNamespace(images=[{"name": "Missing", "top": 80}])
        with self.assertRaises(KeyError):
            page_image_events(page, SimpleNamespace(images={}))


if __name__ == "__main__":
    unittest.main()
