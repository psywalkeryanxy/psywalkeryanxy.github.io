# Trial-by-trial Behavioral Data — vmPFC Recordings


## Subjects
| Subject | # Neurons |
|---------|-----------|
| Batman  | 106       |
| Hobbes  | 50        |

## File structure (`vmPFC_Trial_Vars_shared.mat`)
```
newTrial_Vars
├── subj_ID
│   ├── Batman                 % [106 x 1] cell, one entry per neuron
│   │   └── {n}.vars           % [trial numbers x 5] double — trials x variables
│   └── Hobbes                 % [50 x 1] cell, one entry per neuron
│       └── {n}.vars           % [trial numbers x 5] double
├── var_names                  % {'choice','reward','prev_reward','SU_offer1','SU_offer2'}
└── var_idx_in_original        % [9 10 14 30 33] — original column indices
```


## Variables (5 columns, in order)

| # | Name          || Description                                       | Coding                          |
|---|---------------||---------------------------------------------------|---------------------------------|
| 1 | `choice`      || Which offer the subject chose                     | 1 = offer 1, 0 = offer 2        |
| 2 | `reward`      || Reward received on this trial                     | numeric                         |
| 3 | `prev_reward` || Whether the *previous* trial was rewarded         | 0 = no, 1 = yes                 |
| 4 | `SU_offer1`   || Subjective utility of offer 1, computed via JMF   | numeric                         |
| 5 | `SU_offer2`   || Subjective utility of offer 2, computed via JMF   | numeric                         |



## Contact
Xinyuan Yan — Baylor College of Medicine
