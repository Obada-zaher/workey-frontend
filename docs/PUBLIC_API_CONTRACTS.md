# Public Homepage API Contracts

The homepage uses no Authorization header.

## `GET /home`

Guest data is `viewer`, `hero`, `latest_jobs`, `featured_companies`, and `app_features`. The homepage renders these fields directly for the hero, latest opportunities, companies, and product tools.

## `GET /jobs`

The public job list returns a pagination object with `data` and `meta`. Confirmed filters are `search`, `location`, `skill` (slug or ID), `experience_level`, `employment_type`, `work_mode`, `accepting_applications`, `sort_by`, `sort_direction`, `per_page`, and `page`.

The homepage search exposes keyword, location, and confirmed work-mode values. Public company search is not supported, and skill filtering requires a known skill slug or ID. Internship roles use the confirmed `employment_type=internship` filter. Work-mode values are `remote`, `hybrid`, and `on_site`.

No public featured/urgent flags, categories, company filter, or taxonomy endpoint was found. The UI intentionally does not fabricate those collections, counts, or labels.
