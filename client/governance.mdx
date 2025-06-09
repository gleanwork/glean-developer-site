---
title: 'Governance APIs'
icon: 'shield'
---

## Context

Governance APIs focus on sensitive-content **policies** and **reports**.
Configure them in the Glean UI under **Admin → Governance**. You can also configure the same using the APIs provided.
Each policy or report scans every indexed document according to its settings and surfaces any violations for review.

You can also hide or unhide documents through the **Sensitive Findings** and **Content Hiding** dashboards or the corresponding APIs.

# Authorization

To call the policy and report endpoints, create a **Client API token** with scope `DATA_GOVERNANCE`. The token must belong to a user who can access the Sensitive Content pages (for example, a Super Admin or Sensitive Content Moderator).

For content-hiding endpoints, generate a token with scope `CONTENT_HIDING`. The associated user must be able to edit visibility overrides, typically a Super Admin.

See [Authentication](https://developers.glean.com/client/authentication) for detailed steps.

## Difference between policies and reports

A report runs a one-off scan and lets you download violations as a CSV when it finishes.

Policies support two schedules—`WEEKLY` and `CONTINUOUS`.
A policy adds an interactive dashboard where you can review findings, archive items, and optionally hide flagged documents.

Note: Policy and report APIs share many request fields. Ensure any shared fields use consistent values within the same payload.

# APIs

Governance APIs fall into three groups: **policy**, **report**, and **content-hiding** endpoints.

Both policies and reports share a common configuration object, **config**.
This has certain fields that need not be populated while submitting a report or policy to be created as they are only meant to be populated on return.
Namely, the config **version**, **createdAt** and **createdBy** will automatically be set without needing to be passed.

## Policy APIs

With these endpoints, you can perform CRUD operations on policies.
Policies created/edited through these would reflect in the Sensitive Findings section under the Admin > Governance section in the Glean UI.

### Creating a policy

This will create a new policy with all the specified configurations.
The payload will need the name of the new policy, its configuration, frequency and autoHideDocs. 
Note, only WEEKLY and CONTINUOUS frequencies are supported for policies.

Once created, the entire policy will be returned back along with its unique **id**.

See [Creating a Policy](https://developers.glean.com/client/api/governance/creates-new-policy) for detailed specs.

### Updating a policy

This will update an existing policy. Specifically the policy with the same is as the one passed in the path.
Any one of the fields **config, frequency, status, autoHideDocs, name** must be passed for the update call to pass.
The unset fields will remain the same. Whether the update was successful or not would be returned.

See [Updating a Policy](https://developers.glean.com/client/api/governance/updates-an-existing-policy) for detailed specs.

### Getting a policy

This will fetch an existing policy matching the id provided.
The policy version can also be optionally provided to get an older version of the policy if it has been edited.
The entire policy will be returned.

See [Get a Policy](https://developers.glean.com/client/api/governance/gets-specified-policy) for detailed specs.

### Listing multiple policies

This will fetch all the existing policies with some filtering.
You can provide the **autoHide** and **frequency** parameters to filter on.

See [Listing Policies](https://developers.glean.com/client/api/governance/lists-policies) for detailed specs.

### Downloading policy violations

This will download a CSV file of all the violations of a specific policy's latest scan. 

Note: this is only supported for weekly policies. Continuous policies will have their findings continuously dumped into your cloud storage from where you can consume them directly.

See [Download Policy Violations](hhttps://developers.glean.com/client/api/governance/downloads-violations-csv-for-policy) for detailed specs.

## Report APIs

Only creating a one-time report is supported via API for reports.
You can get the report's scan status to check if it has completed and download its violation CSV.
For any of the other features such as updating, other frequencies, etc., please use policies.

Reports created using this endpoint will appear in the "Sensitive Content Reporting" section under Admin > Governance in the UI.

### Creating and running a one-time report

This will create a report and immediately trigger its sensitive content scan. The **frequency** field must be populated with ONCE.

In the config, the **createdAt** and **version** field need not be set. **CreatedBy** is optional.

See [Creating a Report](https://developers.glean.com/client/api/governance/creates-new-one-time-report) for detailed specs.

### Getting a reports scan status

This will get the current status of the Report's scan.

| `Status`  | Description                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PENDING` | Implies that the run is in progress.                                                                                     |
| `SUCCESS` | Implies the run is complete and the violation can be downloaded.                                                         |
| `FAILURE` | Implies there was some problem during the execution of the scan and it has failed. You would have to retry in this case. |

It also returns the timestamp at which the scan started.

See [Get Report Status](https://developers.glean.com/client/api/governance/fetches-report-run-status) for detailed specs.

### Downloading report violations

This will download a CSV file of all the violations of a specific report.

See [Download Report Violations](https://developers.glean.com/client/api/governance/downloads-violations-csv-for-report) for detailed specs.

## Content hiding APIs

Content hiding works by setting a "visibility override" to a particular document. These overrides can come from different sources, such as: 

1. Existing policies that might flag a document meeting its requirements if "auto-hide" is enabled.

2. If it is manually hidden by a user. Different users are treated as different sources.

3. If a document is present in the CSV for hiding it.

Each of these overrides is distinct and if any one of them hide a document, it will be hidden. This rest endpoint only gives you control over the "manual override by user".

### Visibility overrides

Visibility overrides refer to the visiblity of a document that is being enforced from a particular source.
For example, policy A might want the document to be visible, while policy B might want it to be hidden.
All these sources are considered together and the source with the highest visiblity override is considered.
A user can also be a source of visibility override which is what the below API provides.

There are three types of visibility overrides status.

| `Override Status`            | Description                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `HIDE_FROM_ALL`              | The document is hidden from all Glean users.                                                                             |
| `HIDE_FROM_ALL_EXCEPT_OWNER` | The document is hidden from all Glean users except for the owner. If there is no owner, it remains hidden from everyone. |
| `HIDE_FROM_GROUPS`           | The document is hidden from all users except those explicitly shared with.                                               |

### Submitting visibility overrides for documents

You can submit a list of document ids along with the desired visibility override for each one. This will set the "user" level visibility override for the document. 

The returned value contains the documents along with their visibility override values and whether the action was successful for them.
This endpoint could have a partial failure which can be deduced from the **success** field in the return parameter.

See [Hide/Unhide Documents](https://developers.glean.com/client/api/governance/hide-or-unhide-docs) for detailed specs.

### Getting visibility overrides for documents

You can submit a list of document ids and get the current final visibility override for the documents passed.

See [Get Document Visibility](https://developers.glean.com/client/api/governance/fetches-documents-visibility) for detailed specs.
