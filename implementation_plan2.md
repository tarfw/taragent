# Step 1 — TAR Agent: Full Opcode Interpreter + Product Ordering via AI

## What This Achieves

The **Agents screen** becomes the interface for all natural language commerce operations. User types plain English → TAR Interpreter maps it to the correct opcode family → trace record created → **Trace screen** shows it live.

---

## Proposed Changes

### Backend — [src/agents/interpreter.ts](file:///c:/tarfwk/taragent/src/agents/interpreter.ts)

#### [MODIFY] Opcode extraction prompt ([extractIntentAi](file:///c:/tarfwk/taragent/src/agents/interpreter.ts#246-289))

Rewrite the AI system prompt to cover all 9 opcode families:

| Family    | Range | Examples                                  |
| --------- | ----- | ----------------------------------------- |
| Stock     | 1xx   | "receive 50 shoes", "sell 2 speakers"     |
| Billing   | 2xx   | "create invoice", "mark payment received" |
| Workflow  | 3xx   | "create a task assign to john"            |
| Accounts  | 4xx   | "pay out $200 to supplier"                |
| Orders    | 5xx   | "create order for product:speaker"        |
| Transport | 6xx   | "start ride for driver:ali"               |
| Tax       | 7xx   | "record GST for invoice:123"              |
| AI Memory | 8xx   | "remember that nike prefers bulk orders"  |
| Identity  | 9xx   | "create user admin for shop"              |

#### [MODIFY] Opcode-to-name mapping

Add a `OPCODE_NAMES` map for readable display in frontend.

#### [MODIFY] Broadcast filter

Update `broadcastOpcodes` to include all operationally meaningful opcodes (not just 101, 102, 103, 110).

---

### Backend — [src/index.ts](file:///c:/tarfwk/taragent/src/index.ts)

No changes needed — `/api/channel` already routes NL text to the interpreter.

---

### Frontend — [src/screens/aiagents.tsx](file:///c:/tarfwk/taragent/tarapp/src/screens/aiagents.tsx)

#### [MODIFY] Result display after NL operation

When the result is from an NL operation (not SEARCH), show a clean **confirmation card** instead of raw JSON:

- Opcode badge (colour-coded by family)
- Opcode name (e.g. SALEOUT, ORDERCREATE)
- StreamID (the target entity)
- Status + delta

---

### Frontend — [src/screens/trace.tsx](file:///c:/tarfwk/taragent/tarapp/src/screens/trace.tsx)

#### [MODIFY] Opcode icon + name mapping

Expand [renderIconForOpcode](file:///c:/tarfwk/taragent/tarapp/src/screens/trace.tsx#25-33) and [renderTextForOpcode](file:///c:/tarfwk/taragent/tarapp/src/screens/trace.tsx#34-42) to handle all 9xx families with meaningful icons and labels.

---

## Verification Plan

1. Type "sell 3 product:speaker" → trace shows SALEOUT (102), delta -3
2. Type "create order for product:nike1" → trace shows ORDERCREATE (501)
3. Type "create task check inventory assign to john" → trace shows TASKCREATE (301)
4. Type "search bluetooth speakers" → semantic search results appear, no trace
5. Trace screen shows correct icons for each opcode

### ✅ TAR Complete Opcode List (Final)

---

## 🧱 1xx — Stock / Inventory

| Code | Name             |
| ---- | ---------------- |
| 101  | STOCKIN          |
| 102  | SALEOUT          |
| 103  | SALERETURN       |
| 104  | STOCKADJUST      |
| 105  | STOCKTRANSFEROUT |
| 106  | STOCKTRANSFERIN  |
| 107  | STOCKVOID        |

---

## 🧾 2xx — Invoice / Billing

| Code | Name               |
| ---- | ------------------ |
| 201  | INVOICECREATE      |
| 202  | INVOICEITEMADD     |
| 203  | INVOICEPAYMENT     |
| 204  | INVOICEPAYMENTFAIL |
| 205  | INVOICEVOID        |
| 206  | INVOICEITEMDEFINE  |
| 207  | INVOICEREFUND      |

---

## 🧑‍💼 3xx — Tasks / Workflow

| Code | Name         |
| ---- | ------------ |
| 301  | TASKCREATE   |
| 302  | TASKASSIGN   |
| 303  | TASKSTART    |
| 304  | TASKPROGRESS |
| 305  | TASKDONE     |
| 306  | TASKFAIL     |
| 307  | TASKBLOCK    |
| 308  | TASKRESUME   |
| 309  | TASKVOID     |
| 310  | TASKLINK     |
| 311  | TASKCOMMENT  |

---

## 💰 4xx — Accounts / Ledger

| Code | Name          |
| ---- | ------------- |
| 401  | ACCOUNTPAYIN  |
| 402  | ACCOUNTPAYOUT |
| 403  | ACCOUNTREFUND |
| 404  | ACCOUNTADJUST |

---

## 🚚 5xx — Orders / Delivery

| Code | Name         |
| ---- | ------------ |
| 501  | ORDERCREATE  |
| 502  | ORDERSHIP    |
| 503  | ORDERDELIVER |
| 504  | ORDERCANCEL  |

---

## 🚕 6xx — Transport / Booking / Rental

| Code | Name          |
| ---- | ------------- |
| 601  | RIDECREATE    |
| 602  | RIDESTART     |
| 603  | RIDEDONE      |
| 604  | RIDECANCEL    |
| 605  | MOTION        |
| 611  | BOOKINGCREATE |
| 612  | BOOKINGDONE   |
| 621  | RENTALSTART   |
| 622  | RENTALEND     |

---

## 🏛 7xx — Tax / Government

| Code | Name         |
| ---- | ------------ |
| 701  | GSTVATACCRUE |
| 702  | GSTVATPAY    |
| 703  | GSTVATREFUND |

---

## 🧠 8xx — AI / Memory

| Code | Name           |
| ---- | -------------- |
| 801  | MEMORYDEFINE   |
| 802  | MEMORYWRITE    |
| 803  | MEMORYUPDATE   |
| 804  | MEMORYSNAPSHOT |

---

## 🔐 9xx — Identity / Access

| Code | Name          |
| ---- | ------------- |
| 901  | USERCREATE    |
| 902  | USERROLEGRANT |
| 903  | USERAUTH      |
| 904  | USERDISABLE   |

---

## 🔥 Summary

```text id="opfinal"
1xx → stock
2xx → billing
3xx → workflow
4xx → accounts
5xx → orders
6xx → transport
7xx → tax
8xx → AI memory
9xx → identity
```

---

✅ This opcode system is **complete for universal commerce TAR**.
