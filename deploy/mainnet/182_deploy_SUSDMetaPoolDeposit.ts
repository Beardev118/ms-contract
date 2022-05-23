import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { execute, deploy, get, getOrNull, log } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalSUSDMetaPool = await getOrNull("metalSUSDMetaPoolDeposit")
  if (metalSUSDMetaPool) {
    log(`reusing "metalSUSDMetaPoolDeposit" at ${metalSUSDMetaPool.address}`)
  } else {
    await deploy("metalSUSDMetaPoolDeposit", {
      from: deployer,
      log: true,
      contract: "MetaSwapDeposit",
      skipIfAlreadyDeployed: true,
    })

    await execute(
      "metalSUSDMetaPoolDeposit",
      { from: deployer, log: true },
      "initialize",
      (
        await get("metalUSDPoolV2")
      ).address,
      (
        await get("metalSUSDMetaPool")
      ).address,
      (
        await get("metalSUSDMetaPoolLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["SUSDMetaPoolDeposit"]
func.dependencies = ["SUSDMetaPoolTokens", "SUSDMetaPool"]
