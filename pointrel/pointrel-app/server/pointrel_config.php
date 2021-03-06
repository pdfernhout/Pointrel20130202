<?php
// Change these options as appropriate for your system
// Note the need for a trailing slash for these directory names

$pointrelResourcesDirectory = "../../pointrel-data/resources/";

$pointrelJournalsDirectory = "../../pointrel-data/journals/";
$pointrelJournalsAllow = true;
$pointrelJournalsDeleteAllow = true;

$pointrelVariablesDirectory = "../../pointrel-data/variables/";
$pointrelVariablesAllow = true;
$pointrelVariablesDeleteAllow = true;

$pointrelLogsDirectory = "../../pointrel-data/logs/";

$pointrelPublishingDirectory = "../../pointrel-www/";
$pointrelPublishingAllow = true;

$pointrelIndexesDirectory = "../../pointrel-data/indexes/";
$pointrelIndexesMaintain = true;
// Set to 0 to turn off, 2048 for probably a reasonable size (the content is base 64 encoded so takes somewhat more space)
$pointrelIndexesEmbedContentSizeLimitInBytes = 2048;
$pointrelIndexesCustomFunction = null;
