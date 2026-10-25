"""Focused controls for the throwaway CLI; model quality is tested separately."""
import argparse
import contextlib
import hashlib
import io
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import coach

class Controls(unittest.TestCase):
    def test_public_and_credentialed_endpoints_rejected(self):
        for value in ["https://example.com","http://8.8.8.8:11434","http://user:secret@127.0.0.1:11434"]:
            with self.assertRaises(ValueError):
                coach.local_host(value)

    def test_proposal_does_not_mutate_current_version(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None)
            s.root=Path(folder);s.active="original";s.pending=None;s.preview="old note"
            s.pending_checks=None;s.bundled_style=True;s.simulation_b_exposed=False
            s.discuss_test_armed=False;s.development_preview="A note";s.simulation_b_preview=None
            s.versions=[{"version":1,"prompt":"original"}];s.metrics=[];s.history=[]
            s.last_fixture="development-a";s.spec="brief";s.metadata={}
            s.call=lambda *args:json.dumps({"message":"Shorten it","prompt":"new prompt"})
            with contextlib.redirect_stdout(io.StringIO()):
                s.propose("Shorter please")
            self.assertEqual(s.active,"original")
            self.assertEqual(len(s.versions),1)
            self.assertEqual(s.pending,"new prompt")
            with contextlib.redirect_stdout(io.StringIO()):
                s.apply()
            self.assertEqual(s.active,"new prompt")
            self.assertEqual(len(s.versions),2)
            self.assertIsNone(s.preview)
            with contextlib.redirect_stdout(io.StringIO()):
                s.undo()
            self.assertEqual(s.active,"original")
            self.assertEqual(len(s.versions),3)
            self.assertEqual(s.versions[1]["prompt"],"new prompt")

    def test_absent_actions_and_invented_quote_are_flagged(self):
        source="Client: I feel lighter."
        note='Client Discussed: The client said "fully cured".\nTherapist Contribution: Asked a question.\nNext Actions: Practice daily.'
        checks=coach.Spike.check(note,source,"simulation-b")
        self.assertFalse(checks["next_actions_absent_when_no_actions"])
        self.assertEqual(checks["quotes_not_exactly_in_source"],["fully cured"])

    def test_clarifying_reply_does_not_create_proposal(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None);s.root=Path(folder)
            s.active="original";s.pending=None;s.preview=None;s.versions=[]
            s.pending_checks=None;s.bundled_style=True;s.simulation_b_exposed=False
            s.discuss_test_armed=False;s.development_preview=None;s.simulation_b_preview=None
            s.metrics=[];s.history=[];s.last_fixture=None;s.spec="brief";s.metadata={}
            s.call=lambda *args:json.dumps({"message":"What should improve?","prompt":None})
            with contextlib.redirect_stdout(io.StringIO()):s.propose("Better")
            self.assertEqual(s.active,"original")
            self.assertIsNone(s.pending)

    def test_markdown_fenced_json_with_language_is_parsed(self):
        result=coach.parse_coach_json('```json\n{"message":"Ready","prompt":"brief"}\n```')
        self.assertEqual(result,{"message":"Ready","prompt":"brief"})

    def test_style_file_is_read_as_utf8_and_empty_style_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"style.md"
            path.write_text("Fictional style: concise; café spelling.",encoding="utf-8")
            self.assertIn("café",coach.read_style(path))
            path.write_text("  \n",encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"empty"):
                coach.read_style(path)

    def test_oversized_request_fails_before_local_request(self):
        s=coach.Spike.__new__(coach.Spike)
        s.args=argparse.Namespace(context=512,output_tokens=100,model="local",temperature=0,
                                  timeout=1)
        s.http=None;s.host="http://127.0.0.1:11434";s.metrics=[]
        s.request=lambda *args:self.fail("oversized request reached endpoint")
        with self.assertRaisesRegex(ValueError,"no history was truncated"):
            s.call("coach",[{"role":"user","content":"x"*1200}])

    def test_failed_generation_invalidates_old_acceptance_target(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None)
            s.root=Path(folder);s.active="current";s.pending=None;s.preview="old note"
            s.versions=[{"version":1,"prompt":"current"}];s.metrics=[];s.history=[]
            s.pending_checks=None;s.bundled_style=True;s.simulation_b_exposed=False
            s.discuss_test_armed=False;s.development_preview=None;s.simulation_b_preview=None
            s.last_fixture="development-a";s.last_record=Path(folder)/"old.json"
            s.last_record.write_text(json.dumps({"style_version":1,"prompt_snapshot":"current",
                                                "note":"old note","clinician_acceptance":None}))
            s.metadata={}
            s.call=lambda *args:(_ for _ in ()).throw(RuntimeError("simulated local failure"))
            with self.assertRaisesRegex(RuntimeError,"simulated local failure"):
                s.generate("development-a")
            self.assertIsNone(s.preview)
            self.assertIsNone(s.last_record)
            with contextlib.redirect_stdout(io.StringIO()):
                s.accept()
            old=json.loads((Path(folder)/"old.json").read_text())
            self.assertIsNone(old["clinician_acceptance"])

    def test_cancelled_generation_invalidates_old_acceptance_target(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None)
            s.root=Path(folder);s.active="current";s.pending=None;s.preview="old note"
            s.pending_checks=None;s.bundled_style=True;s.simulation_b_exposed=False
            s.discuss_test_armed=False;s.development_preview=None;s.simulation_b_preview=None
            s.versions=[{"version":1,"prompt":"current"}];s.metrics=[];s.history=[]
            s.last_fixture="development-a";s.last_record=Path(folder)/"old.json"
            s.metadata={}
            s.call=lambda *args:(_ for _ in ()).throw(KeyboardInterrupt())
            with self.assertRaises(KeyboardInterrupt):
                s.generate("simulation-b")
            self.assertIsNone(s.preview)
            self.assertIsNone(s.last_record)

    def test_identical_prompt_is_noop_and_cannot_be_applied(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None);s.root=Path(folder)
            s.active="same prompt";s.pending="older proposal";s.pending_checks={"old":True}
            s.preview=None;s.versions=[{"version":1,"prompt":"same prompt"}]
            s.metrics=[];s.history=[];s.last_fixture="development-a";s.spec="brief"
            s.bundled_style=True;s.simulation_b_exposed=False;s.discuss_test_armed=False
            s.development_preview=None;s.simulation_b_preview=None;s.metadata={}
            s.call=lambda *args:json.dumps({"message":"This is better","prompt":"same prompt"})
            output=io.StringIO()
            with contextlib.redirect_stdout(output):
                s.propose("Make no actual change")
                applied=s.apply()
            self.assertIn("No prompt change",output.getvalue())
            self.assertFalse(applied)
            self.assertIsNone(s.pending)
            self.assertEqual(len(s.versions),1)

    def test_chat_after_test_keeps_a_context_without_opt_in(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None);s.root=Path(folder)
            s.active="active";s.pending=None;s.pending_checks=None;s.preview="B note"
            s.versions=[{"version":1,"prompt":"active"}];s.metrics=[];s.history=[]
            s.last_fixture="simulation-b";s.spec="brief";s.bundled_style=True
            s.simulation_b_exposed=False;s.discuss_test_armed=False
            s.development_preview="A note";s.simulation_b_preview="B note";s.metadata={}
            s.code_sha256=coach.sha256_file(Path(coach.__file__))
            s.args=argparse.Namespace(script=None,context=8192,output_tokens=700,model="local",
                                      temperature=0,timeout=1)
            captured={}
            def request(path,payload,before_send=None):
                captured["payload"]=payload
                if before_send:
                    before_send()
                return {"message":{"content":json.dumps({"message":"Revision","prompt":"revised"})},
                        "done_reason":"stop"}
            s.request=request
            output=io.StringIO()
            with contextlib.redirect_stdout(output):
                s.propose("Use what you saw")
            state=json.loads((Path(folder)/"state.json").read_text())
            context=json.loads(captured["payload"]["messages"][-1]["content"])
            self.assertEqual(context["source_fixture"],"development-a")
            self.assertEqual(context["latest_note"],"A note")
            self.assertNotIn("B note",json.dumps(context))
            self.assertFalse(s.simulation_b_exposed)
            self.assertFalse(state["simulation_b_exposed_to_coach"])
            self.assertFalse(s.discuss_test_armed)

    def test_explicit_discuss_test_sends_b_and_persists_exposure(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None,context=8192,output_tokens=700,model="local",
                                      temperature=0,timeout=1)
            s.root=Path(folder);s.active="active";s.pending=None;s.pending_checks=None
            s.preview="B note";s.development_preview="A note";s.simulation_b_preview="B note"
            s.versions=[{"version":1,"prompt":"active"}];s.metrics=[];s.history=[]
            s.last_fixture="simulation-b";s.spec="brief";s.bundled_style=True
            s.simulation_b_exposed=False;s.discuss_test_armed=False
            s.metadata={}
            s.code_sha256=coach.sha256_file(Path(coach.__file__))
            captured={}
            def request(path,payload,before_send=None):
                captured["payload"]=payload
                if before_send:
                    self.assertFalse(s.simulation_b_exposed)
                    before_send()
                return {"message":{"content":json.dumps({"message":"Revision","prompt":"revised"})},
                        "done_reason":"stop"}
            s.request=request
            output=io.StringIO()
            with contextlib.redirect_stdout(output):
                self.assertTrue(s.discuss_test())
                self.assertFalse(s.simulation_b_exposed)
                s.propose("Use the simulation output")
            context=json.loads(captured["payload"]["messages"][-1]["content"])
            state=json.loads((Path(folder)/"state.json").read_text())
            self.assertEqual(context["source_fixture"],"simulation-b")
            self.assertEqual(context["latest_note"],"B note")
            self.assertTrue(s.simulation_b_exposed)
            self.assertTrue(state["simulation_b_exposed_to_coach"])
            self.assertFalse(s.discuss_test_armed)
            self.assertIn("new untouched transcript C",output.getvalue())

    def test_accept_matching_note_records_synthetic_reviewer(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script="synthetic-script.json")
            s.active="active";s.preview="completed note";s.versions=[{"version":1,"prompt":"active"}]
            s.last_record=Path(folder)/"note.json"
            s.last_record.write_text(json.dumps({"style_version":1,"prompt_snapshot":"active",
                                                 "note":"completed note","acceptance":None}))
            with contextlib.redirect_stdout(io.StringIO()):
                s.accept()
            record=json.loads(s.last_record.read_text())
            self.assertEqual(record["acceptance"]["decision"],"accept")
            self.assertEqual(record["acceptance"]["reviewer"],"scripted_test")

    def test_cancelled_coach_call_clears_pending_and_repl_continues(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None,context=8192,output_tokens=700,model="local",
                                      temperature=0,timeout=1)
            s.root=Path(folder);s.active="active";s.pending="stale proposal";s.pending_checks={"stale":True}
            s.preview=None;s.development_preview="A note";s.simulation_b_preview=None
            s.versions=[{"version":1,"prompt":"active"}];s.metrics=[];s.history=[]
            s.last_fixture="development-a";s.spec="brief";s.bundled_style=True
            s.simulation_b_exposed=False;s.discuss_test_armed=False;s.metadata={}
            s.code_sha256=coach.sha256_file(Path(coach.__file__))
            def cancelled_request(path,payload,before_send=None):
                state=json.loads((Path(folder)/"state.json").read_text())
                self.assertIsNone(state["pending_prompt"])
                raise KeyboardInterrupt()
            s.request=cancelled_request
            stdout=io.StringIO();stderr=io.StringIO()
            with patch("builtins.input",side_effect=["Revise it","/quit"]):
                with contextlib.redirect_stdout(stdout),contextlib.redirect_stderr(stderr):
                    s.run()
            state=json.loads((Path(folder)/"state.json").read_text())
            self.assertEqual(state["metrics"][-1]["outcome"],"cancelled")
            self.assertIsNone(state["pending_prompt"])
            self.assertEqual(s.active,"active")
            self.assertEqual(len(s.versions),1)
            self.assertIn("Cancelled current local request",stderr.getvalue())
            self.assertNotIn("Traceback",stdout.getvalue()+stderr.getvalue())

    def test_output_cap_is_recorded_as_rejected_incomplete(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(context=8192,output_tokens=700,model="local",temperature=0,timeout=1)
            s.root=Path(folder);s.metrics=[];s.host="http://127.0.0.1:11434";s.http=None
            s.request=lambda *args,**kwargs:{"done_reason":"length","message":{"content":"partial"}}
            s.metadata={};s.active=None;s.pending=None;s.pending_checks=None;s.versions=[]
            s.last_fixture=None;s.simulation_b_exposed=False;s.discuss_test_armed=False;s.history=[]
            with self.assertRaisesRegex(RuntimeError,"token cap"):
                s.call("coach",[{"role":"user","content":"small"}])
            self.assertEqual(s.metrics[-1]["outcome"],"rejected_incomplete")

    def test_note_record_contains_code_and_source_fixture_hashes(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script="synthetic-script.json")
            s.root=Path(folder);s.active="active";s.pending=None;s.pending_checks=None;s.preview=None
            s.versions=[{"version":1,"prompt":"active"}];s.metrics=[];s.history=[]
            s.last_fixture=None;s.last_record=None;s.spec="brief";s.bundled_style=True
            s.development_preview=None;s.simulation_b_preview=None;s.simulation_b_exposed=False
            s.discuss_test_armed=False;s.metadata={};s.code_sha256=coach.sha256_file(Path(coach.__file__))
            s.call=lambda *args:"Client Discussed: Example.\nTherapist Contribution: Example."
            record=s.generate("development-a")
            expected=hashlib.sha256((coach.HERE/"fixtures/development-a.txt").read_bytes()).hexdigest()
            self.assertEqual(record["code_sha256"],s.code_sha256)
            self.assertEqual(record["source_fixture_sha256"],expected)

    def test_new_run_metadata_contains_code_fixture_and_style_hashes(self):
        with tempfile.TemporaryDirectory() as folder:
            args=argparse.Namespace(host="http://127.0.0.1:11434",model="installed-local",
                                    output=folder,script=None,style=None,context=4096,
                                    output_tokens=700,temperature=1.0,timeout=1)
            def local_response(self,path,data=None):
                if path=="/api/tags":
                    return {"models":[{"name":"installed-local","digest":"digest"}]}
                return {"version":"test"}
            with patch.object(coach.Spike,"request",local_response):
                with contextlib.redirect_stdout(io.StringIO()):
                    s=coach.Spike(args)
            metadata=json.loads((s.root/"state.json").read_text())["metadata"]
            self.assertEqual(metadata["code_sha256"],coach.sha256_file(Path(coach.__file__)))
            self.assertEqual(metadata["fixture_sha256"]["development-a"],
                             coach.sha256_file(coach.HERE/"fixtures/development-a.txt"))
            self.assertEqual(metadata["style_input_sha256"],
                             coach.sha256_file(coach.HERE/"fixtures/style-request.txt"))

    def test_bundled_a_checks_expose_missing_quote_action_and_prompt_canary(self):
        source=(coach.HERE/"fixtures/development-a.txt").read_text()
        note="Client Discussed: Work was difficult.\nTherapist Contribution: The therapist asked a question."
        checks=coach.Spike.check(note,source,"development-a",prompt="Keep the pottery example.")
        self.assertEqual(checks["quote_count"],0)
        self.assertFalse(checks["bundled_development_a_expected_quote_present"])
        self.assertFalse(checks["bundled_development_a_explicit_action_present"])
        self.assertTrue(checks["bundled_active_prompt_contains_example_canary"])

    def test_custom_style_has_no_bundled_fixture_expectations(self):
        checks=coach.Spike.check("Client Discussed: x", "Client: x", "development-a",
                                 prompt="Custom", bundled_style=False)
        self.assertIsNone(checks["bundled_development_a_expected_quote_present"])
        self.assertIsNone(checks["bundled_development_a_explicit_action_present"])
        self.assertIsNone(checks["bundled_active_prompt_contains_example_canary"])

    def test_proposed_prompt_example_canary_is_reported_before_apply(self):
        with tempfile.TemporaryDirectory() as folder:
            s=coach.Spike.__new__(coach.Spike)
            s.args=argparse.Namespace(script=None);s.root=Path(folder)
            s.active="current";s.pending=None;s.pending_checks=None;s.preview=None
            s.versions=[{"version":1,"prompt":"current"}];s.metrics=[];s.history=[]
            s.last_fixture="development-a";s.spec="brief";s.bundled_style=True
            s.simulation_b_exposed=False;s.discuss_test_armed=False
            s.development_preview=None;s.simulation_b_preview=None;s.metadata={}
            s.call=lambda *args:json.dumps({"message":"Proposal","prompt":"Keep pottery in the example."})
            with contextlib.redirect_stdout(io.StringIO()):
                s.propose("Remove examples")
            self.assertTrue(s.pending_checks["bundled_proposed_prompt_contains_example_canary"])

if __name__=="__main__":
    unittest.main()
