import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { execute, deploy, get, getOrNull, log, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const metalTBTCMetaPoolDeposit = await getOrNull("metalTBTCMetaPoolDeposit")
  if (metalTBTCMetaPoolDeposit) {
    log(
      `reusing "metalTBTCMetaPoolDeposit" at ${metalTBTCMetaPoolDeposit.address}`,
    )
  } else {
    const susdMetaPoolDeposit = await ethers.getContract(
      "metalSUSDMetaPoolDeposit",
    )

    const receipt = await execute(
      "SwapDeployer",
      {
        from: deployer,
        log: true,
      },
      "clone",
      susdMetaPoolDeposit.address,
    )

    const newPoolEvent = receipt?.events?.find(
      (e: any) => e["event"] == "NewClone",
    )
    const btcSwapAddress = newPoolEvent["args"]["cloneAddress"]
    log(
      `deployed TBTC meta pool deposit (targeting "MetaPoolDeposit") at ${btcSwapAddress}`,
    )
    await save("metalTBTCMetaPoolDeposit", {
      abi: (await get("metalSUSDMetaPoolDeposit")).abi,
      address: btcSwapAddress,
    })

    await execute(
      "metalTBTCMetaPoolDeposit",
      { from: deployer, log: true },
      "initialize",
      (
        await get("metalBTCPoolV2")
      ).address,
      (
        await get("metalTBTCMetaPool")
      ).address,
      (
        await get("metalTBTCMetaPoolLPToken")
      ).address,
    )
  }
}
export default func
func.tags = ["TBTCMetaPoolDeposit"]
func.dependencies = ["TBTCMetaPoolTokens", "TBTCMetaPool"]
