import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  UserState,
  ClaimsState,
} from "../../../../../projects/xtream/firebase-ngrx-user-management/src/public_api";

@Component({
  selector: "app-toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: ["./toolbar.component.css"],
})
export class ToolbarComponent implements OnInit {
  @Input() auth: UserState;
  @Input() claims: ClaimsState;
  @Output() logout = new EventEmitter();

  constructor() {}

  ngOnInit() {}
}
