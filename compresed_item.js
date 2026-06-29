function getCraftRequirements(targetTier, count) {
    const requirements = {};

    let amount = count;

    for (let tier = targetTier; tier > 0; tier--) {
        requirements[`Tier ${tier}`] = amount;
        amount *= 9;
    }

    requirements["Tier 0"] = amount;

    return requirements;
}

console.log(getCraftRequirements(4, 8));