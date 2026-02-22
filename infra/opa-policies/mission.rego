package digital_ecology.mission

default allow := false

auto_allow {
  input.fromStatus == "SUBMITTED"
  input.toStatus == "CONTRACTED"
}

auto_allow {
  input.fromStatus == "CONTRACTED"
  input.toStatus == "ALLOCATING"
}

auto_allow {
  input.fromStatus == "ALLOCATING"
  input.toStatus == "EXECUTING"
}

auto_allow {
  input.fromStatus == "EXECUTING"
  input.toStatus == "DELIVERED"
}

auto_allow {
  input.fromStatus == "DELIVERED"
  input.toStatus == "ACCEPTED"
}

auto_allow {
  input.fromStatus == "DELIVERED"
  input.toStatus == "REWORK_REQUIRED"
}

auto_allow {
  input.fromStatus == "DELIVERED"
  input.toStatus == "DISPUTED"
}

auto_allow {
  input.fromStatus == "ACCEPTED"
  input.toStatus == "SETTLED"
}

auto_allow {
  input.fromStatus == "REWORK_REQUIRED"
  input.toStatus == "EXECUTING"
}

auto_allow {
  input.fromStatus == "DISPUTED"
  input.toStatus == "EXECUTING"
}

auto_allow {
  input.fromStatus == "DISPUTED"
  input.toStatus == "ACCEPTED"
}

allow {
  auto_allow
  not input.highRisk
}

allow {
  auto_allow
  input.highRisk
  input.dualApproval
}
